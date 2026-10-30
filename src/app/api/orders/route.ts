import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type IncomingItem = {
  id: number | string;
  quantity: number;
  attributes?: string[];
};

const EXCHANGE_KEY = process.env.EXCHANGE_RATE_API_KEY || "f309933485e263b0337b76ad";
const BOXTAL_BASE = "https://www.envoimoinscher.com/api/v1";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function xmlTag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? match[1] : "";
}

async function resolveShippingBase(input: {
  country: string;
  postalCode: string;
  city: string;
  items: IncomingItem[];
  selected?: { operator?: string; service?: string; price?: number };
}): Promise<number> {
  const fallback = Math.max(0, Math.min(500, Number(input.selected?.price) || 0));
  const access = process.env.BOXTAL_ACCESS_KEY;
  const secret = process.env.BOXTAL_SECRET_KEY;
  if (!access || !secret) return fallback;
  if (input.country !== "FR" && input.country !== "IT") return fallback;
  if (!input.postalCode || !input.city) return fallback;

  try {
    const itemWeight = Number(process.env.BOXTAL_DEFAULT_ITEM_WEIGHT_KG || 0.5);
    const quantity = input.items.reduce(
      (sum, item) => sum + Math.max(1, Math.round(Number(item.quantity) || 1)),
      0
    );
    const weight = Math.max(1, Math.round(quantity * itemWeight * 10) / 10);
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const params = new URLSearchParams({
      "colis_1.poids": String(weight),
      "colis_1.longueur": "30",
      "colis_1.largeur": "20",
      "colis_1.hauteur": "10",
      code_contenu: process.env.BOXTAL_CONTENT_CODE || "40110",
      "expediteur.pays": process.env.BOXTAL_SHIPPER_COUNTRY || "FR",
      "expediteur.code_postal": process.env.BOXTAL_SHIPPER_POSTAL_CODE || "75001",
      "expediteur.ville": process.env.BOXTAL_SHIPPER_CITY || "Paris",
      "expediteur.type": "entreprise",
      "destinataire.pays": input.country,
      "destinataire.code_postal": input.postalCode,
      "destinataire.ville": input.city,
      "destinataire.type": "particulier",
      collecte: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    });
    const auth = Buffer.from(`${access}:${secret}`).toString("base64");
    const res = await fetch(`${BOXTAL_BASE}/cotation?${params.toString()}`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/xml" },
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    const xml = await res.text();
    const offers = Array.from(xml.matchAll(/<offer>([\s\S]*?)<\/offer>/g)).map((match) => {
      const block = match[1];
      const operatorBlock = xmlTag(block, "operator");
      const serviceBlock = xmlTag(block, "service");
      const priceBlock = xmlTag(block, "price");
      const deliveryBlock = xmlTag(block, "delivery");
      return {
        operator: xmlTag(operatorBlock, "code"),
        service: xmlTag(serviceBlock, "code"),
        deliveryType: xmlTag(xmlTag(deliveryBlock, "type"), "code"),
        price: Number(xmlTag(priceBlock, "tax-inclusive") || 0),
      };
    });
    const home = offers.filter((offer) => offer.deliveryType === "HOME" && offer.price > 0);
    const pool = home.length ? home : offers.filter((offer) => offer.price > 0);
    if (pool.length === 0) return fallback;
    const selected = pool.find(
      (offer) =>
        offer.operator === input.selected?.operator && offer.service === input.selected?.service
    );
    const chosen = selected || pool.sort((a, b) => a.price - b.price)[0];
    return round(chosen.price);
  } catch {
    return fallback;
  }
}

async function getRate(currency: string): Promise<number> {
  if (currency === "EUR") return 1;
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/EUR`);
    if (!res.ok) throw new Error("rate fetch failed");
    const data = await res.json();
    const rates = data?.conversion_rates || {};
    if (currency === "USD") return Number(rates.USD) || 1.08;
    if (currency === "DZD") return Number(rates.DZD) || 145;
    return 1;
  } catch {
    if (currency === "USD") return 1.08;
    if (currency === "DZD") return 145;
    return 1;
  }
}

function extractMissingColumn(message: string): string | null {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /column '([^']+)' does not exist/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function persistOrder(payload: Record<string, any>) {
  if (!supabase) throw new Error("Supabase is not configured");
  const current: Record<string, any> = { ...payload };
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await supabase.from("orders").insert([current]).select("id").single();
    if (!error) return data?.id;
    const missing = extractMissingColumn(error.message || "");
    if (missing && Object.prototype.hasOwnProperty.call(current, missing)) {
      delete current[missing];
      continue;
    }
    throw error;
  }
  throw new Error("Could not create order: database schema mismatch");
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const currency = ["EUR", "USD", "DZD"].includes(body?.currency) ? body.currency : "EUR";
  const customer = body?.customer || {};
  const incomingItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];

  if (incomingItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Validate customer
  const firstName = String(customer.firstName || "").trim();
  const lastName = String(customer.lastName || "").trim();
  const email = String(customer.email || "").trim();
  const phone = String(customer.phone || "").trim();
  const country = String(customer.country || "").trim();
  const city = String(customer.city || "").trim();
  const address = String(customer.address || "").trim();
  if (!firstName || !lastName || !email || !phone || !country || !city || !address) {
    return NextResponse.json({ error: "Missing required customer fields" }, { status: 400 });
  }

  // Fetch products from DB
  const ids = incomingItems.map((i) => Number(i.id)).filter((n) => Number.isFinite(n));
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);
  if (prodError) {
    return NextResponse.json({ error: prodError.message }, { status: 500 });
  }
  const productMap = new Map((products || []).map((p: any) => [Number(p.id), p]));

  const rate = await getRate(currency);

  const items: any[] = [];
  let subtotalBase = 0;
  for (const incoming of incomingItems) {
    const product: any = productMap.get(Number(incoming.id));
    if (!product) {
      return NextResponse.json({ error: `Product ${incoming.id} not found` }, { status: 400 });
    }
    if ((product as any).status && (product as any).status !== "published") {
      return NextResponse.json({ error: `Product ${incoming.id} is unavailable` }, { status: 400 });
    }
    const qty = Math.max(1, Math.round(Number(incoming.quantity) || 1));
    if ((product as any).stock != null && qty > Number((product as any).stock)) {
      return NextResponse.json({ error: `Insufficient stock for product ${incoming.id}` }, { status: 400 });
    }
    const basePrice = Number(product.price || 0);
    subtotalBase += basePrice * qty;
    items.push({
      id: Number(product.id),
      name: product.title_translations?.en || product.title || "",
      srcUrl: product.src_url || (Array.isArray(product.gallery) ? product.gallery[0] : ""),
      price: Math.round(basePrice * rate * 100) / 100,
      quantity: qty,
      attributes: Array.isArray(incoming.attributes) ? incoming.attributes : [],
      discount: product.discount || { amount: 0, percentage: 0 },
    });
  }

  const subtotal = Math.round(subtotalBase * rate * 100) / 100;
  const discount = 0;
  const shippingSelection = body?.shipping || {};
  const shippingBase = await resolveShippingBase({
    country,
    postalCode: String(customer.postalCode || "").trim(),
    city,
    items: incomingItems,
    selected: {
      operator: shippingSelection.operator,
      service: shippingSelection.service,
      price: shippingSelection.price,
    },
  });
  const shippingFee = Math.round(shippingBase * rate * 100) / 100;
  const tax = 0;
  const total = Math.round((subtotal - discount + shippingFee + tax) * 100) / 100;

  const payment = body?.payment || {};
  const paymentMethod = payment.method === "stripe" ? "stripe" : "cash_on_delivery";
  const paymentStatus = payment.method === "stripe" ? "paid" : "pending";
  const paymentReference = payment.method === "stripe" ? String(payment.reference || "") || null : null;

  const shippingMethodLabel =
    shippingSelection.label ||
    [shippingSelection.carrier, shippingSelection.service].filter(Boolean).join(" - ") ||
    "standard";
  const shippingAddress = {
    firstName,
    lastName,
    email,
    phone,
    country,
    city,
    address,
    postalCode: customer.postalCode || null,
    region: customer.region || null,
  };
  const customerSnapshot = {
    name: `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email,
    phone,
    country,
    city,
    address,
    postalCode: customer.postalCode || null,
    region: customer.region || null,
    shippingAddress,
    shippingMethod: shippingMethodLabel,
    shippingFee,
    currency,
    subtotal,
    discount,
    tax,
    total,
    status: "pending",
    paymentStatus,
    paymentMethod,
    paymentReference,
    items,
    notes: body?.notes || null,
  };

  const payload: Record<string, any> = {
    customer_name: `${firstName} ${lastName}`.trim(),
    customer_email: email,
    customer_phone: phone,
    shipping_address: shippingAddress,
    shipping_method: shippingMethodLabel,
    shipping_fee: shippingFee,
    currency,
    subtotal,
    discount,
    tax,
    total,
    status: "pending",
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    payment_reference: paymentReference,
    items,
    notes: body?.notes || null,
    cart_id: body?.cartId || null,
    customer: JSON.stringify(customerSnapshot),
  };

  try {
    const orderId = await persistOrder(payload);
    return NextResponse.json({ orderId, total, currency });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create order" }, { status: 500 });
  }
}
