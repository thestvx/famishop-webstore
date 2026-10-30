export async function onRequestPost(context) {
  const { request, env } = context;
  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "https://lahorqznlrzdlupveoja.supabase.co";
  const supabaseKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaG9ycXpubHJ6ZGx1cHZlb2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjQzNjgsImV4cCI6MjEwODcwMDM2OH0.5qGE1B8hQUxW113xKEI6oW9NoIraAkmacMFbb1kCRws";

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const code = String(body?.code || "").trim().toUpperCase();
  const subtotal = Number(body?.subtotal) || 0;
  const currency = ["EUR", "USD", "DZD"].includes(body?.currency) ? body.currency : "EUR";
  const email = String(body?.email || "").trim().toLowerCase();

  if (!code) return json({ valid: false, message: "Enter a promo code" }, 400);

  const res = await fetch(`${supabaseUrl}/rest/v1/discounts?select=*&code=ilike.${encodeURIComponent(code)}&limit=1`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) return json({ valid: false, message: await res.text() }, 500);
  const data = await res.json();
  const d = Array.isArray(data) && data.length ? data[0] : null;
  if (!d) return json({ valid: false, message: "Invalid promo code" }, 200);

  if (d.status !== "active") return json({ valid: false, message: "This promo code is inactive" }, 200);
  const now = new Date();
  if (d.start_date && new Date(d.start_date) > now) return json({ valid: false, message: "This promo code is not active yet" }, 200);
  if (d.expiry_date && new Date(d.expiry_date) < now) return json({ valid: false, message: "This promo code has expired" }, 200);

  if (d.usage_limit != null) {
    const uRes = await fetch(`${supabaseUrl}/rest/v1/discount_usages?select=id&discount_id=eq.${d.id}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: "count=exact" },
    });
    // count via header
    const countHeader = uRes.headers.get("content-range");
    const count = countHeader ? Number(countHeader.split("/")[1]) : 0;
    if (count >= d.usage_limit) return json({ valid: false, message: "This promo code has reached its usage limit" }, 200);
  }

  if (d.per_customer_limit != null && email) {
    const uRes = await fetch(`${supabaseUrl}/rest/v1/discount_usages?select=id&discount_id=eq.${d.id}&customer_email=eq.${encodeURIComponent(email)}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: "count=exact" },
    });
    const countHeader = uRes.headers.get("content-range");
    const count = countHeader ? Number(countHeader.split("/")[1]) : 0;
    if (count >= d.per_customer_limit) return json({ valid: false, message: "You have already used this promo code" }, 200);
  }

  if (d.min_order_amount && subtotal < Number(d.min_order_amount)) {
    return json({ valid: false, message: `Minimum order amount is ${d.min_order_amount} ${d.currency}` }, 200);
  }

  let amount = 0;
  if (d.type === "percentage") {
    amount = Math.round((subtotal * Number(d.value)) / 100 * 100) / 100;
  } else {
    let value = Number(d.value);
    if (d.currency !== currency) {
      const denom = d.currency === "EUR" ? 1 : d.currency === "USD" ? 1.08 : 145;
      const num = currency === "EUR" ? 1 : currency === "USD" ? 1.08 : 145;
      value = value * (num / denom);
    }
    amount = Math.min(value, subtotal);
  }
  if (amount > subtotal) amount = subtotal;
  if (amount < 0) amount = 0;

  return json({
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
