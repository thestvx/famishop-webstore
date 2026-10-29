import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type IncomingItem = {
  id: number | string;
  quantity: number;
  attributes?: string[];
};

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
  for (let attempt = 0; attempt < 20; attempt += 1) {
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
  const shippingFee = 0;
  const tax = 0;
  const total = Math.round((subtotal - discount + shippingFee + tax) * 100) / 100;

  const payload: Record<string, any> = {
    customer_name: `${firstName} ${lastName}`.trim(),
    customer_email: email,
    customer_phone: phone,
    shipping_address: {
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      address,
      postalCode: customer.postalCode || null,
      region: customer.region || null,
    },
    shipping_method: "standard",
    shipping_fee: shippingFee,
    currency,
    subtotal,
    discount,
    tax,
    total,
    status: "pending",
    payment_status: "pending",
    payment_method: "cash_on_delivery",
    items,
    notes: body?.notes || null,
  };

  try {
    const orderId = await persistOrder(payload);
    return NextResponse.json({ orderId, total, currency });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create order" }, { status: 500 });
  }
}
