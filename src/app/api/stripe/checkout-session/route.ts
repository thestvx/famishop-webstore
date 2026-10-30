import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type IncomingItem = {
  id: number | string;
  quantity: number;
  attributes?: string[];
};

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
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
  items: any[];
  selected?: { operator?: string; service?: string; price?: number };
}): Promise<number> {
  const access = process.env.BOXTAL_ACCESS_KEY;
  const secret = process.env.BOXTAL_SECRET_KEY;
  if (!access || !secret) throw new Error("Shipping is not configured");
  if (input.country !== "FR" && input.country !== "IT") throw new Error("Shipping is only available to France and Italy");
  if (!input.postalCode || !input.city) throw new Error("Postal code and city are required");

  const SIZE_MAP: Record<string, { weight: number; length: number; width: number; height: number }> = {
    small: { weight: 0.3, length: 20, width: 15, height: 5 },
    medium: { weight: 0.8, length: 30, width: 20, height: 10 },
    large: { weight: 1.5, length: 40, width: 30, height: 20 },
  };
  try {
    let weight = 0;
    let length = 0;
    let width = 0;
    let height = 0;
    for (const item of input.items) {
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      const wg = item.weightGrams ?? item.weight_grams;
      const wkg = item.weightKg ?? item.weight_kg;
      const weightKg = wkg != null && Number(wkg) > 0 ? Number(wkg) : wg != null && Number(wg) > 0 ? Number(wg) / 1000 : 0;
      let s: { weight: number; length: number; width: number; height: number };
      if (weightKg > 0) {
        const l = Number(item.lengthCm ?? item.length_cm) > 0 ? Number(item.lengthCm ?? item.length_cm) : 0;
        const wd = Number(item.widthCm ?? item.width_cm) > 0 ? Number(item.widthCm ?? item.width_cm) : 0;
        const h = Number(item.heightCm ?? item.height_cm) > 0 ? Number(item.heightCm ?? item.height_cm) : 0;
        const key = String(item.packageSize ?? item.package_size ?? "").toLowerCase();
        const fallback = SIZE_MAP[key] || SIZE_MAP.medium;
        s = { weight: weightKg, length: l || fallback.length, width: wd || fallback.width, height: h || fallback.height };
      } else {
        const key = String(item.packageSize ?? item.package_size ?? "").toLowerCase();
        s = SIZE_MAP[key] || SIZE_MAP.medium;
      }
      weight += s.weight * qty;
      length = Math.max(length, s.length);
      width = Math.max(width, s.width);
      height = Math.max(height, s.height);
    }
    const packaging = Number(process.env.BOXTAL_PACKAGING_WEIGHT_KG || 0);
    weight = weight + (Number.isFinite(packaging) ? packaging : 0);
    weight = Math.max(0.1, Math.round(weight * 1000) / 1000);
    length = length || 30;
    width = width || 20;
    height = height || 10;

    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const params = new URLSearchParams({
      "colis_1.poids": String(weight),
      "colis_1.longueur": String(length),
      "colis_1.largeur": String(width),
      "colis_1.hauteur": String(height),
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
    if (!res.ok) throw new Error(`Boxtal quote failed (${res.status})`);
    const xml = await res.text();
    const offers = Array.from(xml.matchAll(/<offer>([\\s\\S]*?)<\/offer>/g)).map((match) => {
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
    const home = offers.filter((o) => o.deliveryType === "HOME" && o.price > 0);
    const pool = home.length ? home : offers.filter((o) => o.price > 0);
    if (pool.length === 0) throw new Error("No shipping options are available");
    const selected = pool.find(
      (o) => o.operator === input.selected?.operator && o.service === input.selected?.service
    );
    const chosen = selected || pool.sort((a, b) => a.price - b.price)[0];
    return round(chosen.price);
  } catch (e) {
    throw e instanceof Error ? e : new Error("Shipping quote failed");
  }
}

const EXCHANGE_KEY = process.env.EXCHANGE_RATE_API_KEY || "f309933485e263b0337b76ad";

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
  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured (STRIPE_SECRET_KEY)" }, { status: 500 });
  }
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

  const ids = incomingItems.map((i) => Number(i.id)).filter((n) => Number.isFinite(n));
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);
  if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 });
  const productMap = new Map((products || []).map((p: any) => [Number(p.id), p]));

  const rate = await getRate(currency);

  const items: any[] = [];
  let subtotalBase = 0;
  const lineItems: any[] = [];
  for (const incoming of incomingItems) {
    const product: any = productMap.get(Number(incoming.id));
    if (!product) return NextResponse.json({ error: `Product ${incoming.id} not found` }, { status: 400 });
    if (product.status && product.status !== "published") {
      return NextResponse.json({ error: `Product ${incoming.id} is unavailable` }, { status: 400 });
    }
    const qty = Math.max(1, Math.round(Number(incoming.quantity) || 1));
    if (product.stock != null && qty > Number(product.stock)) {
      return NextResponse.json({ error: `Insufficient stock for product ${incoming.id}` }, { status: 400 });
    }
    const basePrice = Number(product.price || 0);
    subtotalBase += basePrice * qty;
    const name = product.title_translations?.en || product.title || "Product";
    items.push({
      id: Number(product.id),
      name,
      srcUrl: product.src_url || (Array.isArray(product.gallery) ? product.gallery[0] : ""),
      price: Math.round(basePrice * rate * 100) / 100,
      quantity: qty,
      attributes: Array.isArray(incoming.attributes) ? incoming.attributes : [],
      discount: product.discount || { amount: 0, percentage: 0 },
    });
    lineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name },
        unit_amount: Math.round(basePrice * rate * 100),
      },
      quantity: qty,
    });
  }

  const subtotal = round(subtotalBase * rate);
  const shippingSelection = body?.shipping || {};
  const shippingItems = incomingItems.map((inc) => {
    const product: any = productMap.get(Number(inc.id));
    return {
      ...inc,
      packageSize: product?.package_size || (product as any)?.packageSize || null,
      weightGrams: product?.weight_grams || (product as any)?.weightGrams || null,
      weightKg: product?.weight_kg || (product as any)?.weightKg || null,
      weight_kg: product?.weight_kg || (product as any)?.weight_kg || null,
      lengthCm: product?.length_cm || (product as any)?.lengthCm || null,
      widthCm: product?.width_cm || (product as any)?.widthCm || null,
      heightCm: product?.height_cm || (product as any)?.heightCm || null,
    };
  });
  let shippingBase: number;
  try {
    shippingBase = await resolveShippingBase({
      country,
      postalCode: String(customer.postalCode || "").trim(),
      city,
      items: shippingItems,
      selected: {
        operator: shippingSelection.operator,
        service: shippingSelection.service,
        price: shippingSelection.price,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Shipping quote failed" }, { status: 502 });
  }
  const shippingFee = round(shippingBase * rate);
  const tax = 0;
  const total = round(subtotal - 0 + shippingFee + tax);

  // Add shipping as a line item
  if (shippingFee > 0) {
    lineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: shippingSelection.label || "Shipping" },
        unit_amount: Math.round(shippingFee * 100),
      },
      quantity: 1,
    });
  }

  const discount = body?.discount || null;

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

  const payload: Record<string, any> = {
    customer_name: `${firstName} ${lastName}`.trim(),
    customer_email: email,
    customer_phone: phone,
    shipping_address: shippingAddress,
    shipping_method: shippingMethodLabel,
    shipping_fee: shippingFee,
    currency,
    subtotal,
    discount: Number(discount?.amount) || 0,
    discount_code: discount?.code || null,
    discount_id: discount?.id || null,
    tax,
    total,
    status: "pending",
    payment_status: "pending",
    payment_method: "stripe",
    payment_reference: null,
    items,
    notes: body?.notes || null,
    cart_id: body?.cartId || null,
    customer: JSON.stringify({
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
      discount: Number(discount?.amount) || 0,
      tax,
      total,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "stripe",
      items,
      notes: body?.notes || null,
    }),
  };

  let orderId: number | null = null;
  try {
    orderId = await persistOrder(payload);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create order" }, { status: 500 });
  }

  // Create a Stripe coupon for the applied promo code (if any).
  let couponId: string | null = null;
  if (discount && Number(discount.amount) > 0) {
    const couponParams = new URLSearchParams();
    couponParams.append("amount_off", String(Math.round(Number(discount.amount) * 100)));
    couponParams.append("currency", currency.toLowerCase());
    couponParams.append("name", `${discount.code} - ${discount.name}`);
    couponParams.append("duration", "once");
    try {
      const cRes = await fetch("https://api.stripe.com/v1/coupons", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: couponParams.toString(),
      });
      const cData = await cRes.json();
      if (cRes.ok && cData?.id) couponId = cData.id;
    } catch {
      // ignore; proceed without coupon
    }
  }

  const domain = process.env.NEXT_PUBLIC_SITE_URL || "https://famishop-webstore.pages.dev";
  const sessionParams: Record<string, any> = {
    ui_mode: "hosted_page",
    mode: "payment",
    billing_address_collection: "auto",
    phone_number_collection: { enabled: false },
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    submit_type: "auto",
    // consent_collection: { terms_of_service: "required" }, // requires ToS URL in Stripe Dashboard
    integration_identifier: "hosted_web_0001",
    success_url: `${domain}/checkout/success/?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
    cancel_url: `${domain}/checkout/`,
    line_items: lineItems,
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    branding_settings: {
      background_color: "#ffffff",
      button_color: "#000000",
      font_family: "default",
      border_style: "rounded",
      icon: { type: "file", file: "file_1UWHL3CjlPXGToodIVhfQlG2" },
    },
  };

  const params = new URLSearchParams();
  // Build form-encoded nested params manually for arrays/objects
  function append(key: string, value: any) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => append(`${key}[${i}]`, v));
    } else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        append(`${key}[${k}]`, v);
      }
    } else {
      params.append(key, String(value));
    }
  }
  for (const [k, v] of Object.entries(sessionParams)) {
    append(k, v);
  }

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || "Stripe error" }, { status: 502 });
    }
    return NextResponse.json({ url: data.url, sessionId: data.id, orderId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Stripe request failed" }, { status: 502 });
  }
}
