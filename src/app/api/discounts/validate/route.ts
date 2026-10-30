import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
  const code = String(body?.code || "").trim().toUpperCase();
  const subtotal = Number(body?.subtotal) || 0;
  const currency = ["EUR", "USD", "DZD"].includes(body?.currency) ? body.currency : "EUR";
  const email = String(body?.email || "").trim().toLowerCase();

  if (!code) {
    return NextResponse.json({ valid: false, message: "Enter a promo code" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .ilike("code", code)
    .limit(1);
  if (error) return NextResponse.json({ valid: false, message: error.message }, { status: 500 });
  const d = Array.isArray(data) && data.length ? data[0] : null;
  if (!d) {
    return NextResponse.json({ valid: false, message: "Invalid promo code" }, { status: 200 });
  }

  // status
  if (d.status !== "active") {
    return NextResponse.json({ valid: false, message: "This promo code is inactive" }, { status: 200 });
  }
  const now = new Date();
  if (d.start_date && new Date(d.start_date) > now) {
    return NextResponse.json({ valid: false, message: "This promo code is not active yet" }, { status: 200 });
  }
  if (d.expiry_date && new Date(d.expiry_date) < now) {
    return NextResponse.json({ valid: false, message: "This promo code has expired" }, { status: 200 });
  }

  // usage limit
  if (d.usage_limit != null) {
    const { count } = await supabase
      .from("discount_usages")
      .select("*", { count: "exact", head: true })
      .eq("discount_id", d.id);
    if ((count || 0) >= d.usage_limit) {
      return NextResponse.json({ valid: false, message: "This promo code has reached its usage limit" }, { status: 200 });
    }
  }

  // per-customer limit
  if (d.per_customer_limit != null && email) {
    const { count } = await supabase
      .from("discount_usages")
      .select("*", { count: "exact", head: true })
      .eq("discount_id", d.id)
      .eq("customer_email", email);
    if ((count || 0) >= d.per_customer_limit) {
      return NextResponse.json({ valid: false, message: "You have already used this promo code" }, { status: 200 });
    }
  }

  // min order amount
  if (d.min_order_amount && subtotal < Number(d.min_order_amount)) {
    return NextResponse.json(
      { valid: false, message: `Minimum order amount is ${d.min_order_amount} ${d.currency}` },
      { status: 200 }
    );
  }

  // compute discount amount
  let amount = 0;
  if (d.type === "percentage") {
    amount = Math.round((subtotal * Number(d.value)) / 100 * 100) / 100;
  } else {
    // fixed: respect currency; convert if needed using rate
    let value = Number(d.value);
    if (d.currency !== currency) {
      // convert fixed amount from discount currency to order currency
      const rateDiscount = d.currency === "EUR" ? 1 : d.currency === "USD" ? 1 / 1.08 : 1 / 145;
      const rateOrder = currency === "EUR" ? 1 : currency === "USD" ? 1.08 : 145;
      value = value * (rateOrder / (d.currency === "EUR" ? 1 : d.currency === "USD" ? 1.08 : 145));
    }
    amount = Math.min(value, subtotal);
  }
  if (amount > subtotal) amount = subtotal;
  if (amount < 0) amount = 0;

  return NextResponse.json({
    valid: true,
    discountId: d.id,
    code: d.code,
    name: d.name,
    type: d.type,
    value: Number(d.value),
    currency: d.currency,
    amount: Math.round(amount * 100) / 100,
    message: "Promo code applied",
  });
}
