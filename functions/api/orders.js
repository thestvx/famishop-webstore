export async function onRequestPost(context) {
  const { request, env } = context;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return json({ error: "Supabase is not configured" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const currency = ["EUR", "USD", "DZD"].includes(body?.currency) ? body.currency : "EUR";
  const customer = body?.customer || {};
  const incomingItems = Array.isArray(body?.items) ? body.items : [];
  if (incomingItems.length === 0) return json({ error: "Cart is empty" }, 400);

  const firstName = String(customer.firstName || "").trim();
  const lastName = String(customer.lastName || "").trim();
  const email = String(customer.email || "").trim();
  const phone = String(customer.phone || "").trim();
  const country = String(customer.country || "").trim();
  const city = String(customer.city || "").trim();
  const address = String(customer.address || "").trim();
  if (!firstName || !lastName || !email || !phone || !country || !city || !address) {
    return json({ error: "Missing required customer fields" }, 400);
  }

  const ids = incomingItems.map((i) => Number(i.id)).filter((n) => Number.isFinite(n));
  const prodRes = await fetch(`${supabaseUrl}/rest/v1/products?select=*&id=in.(${ids.join(",")})`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!prodRes.ok) return json({ error: await prodRes.text() }, 500);
  const products = await prodRes.json();
  const productMap = new Map((products || []).map((p) => [Number(p.id), p]));

  const rate = await getRate(currency, env);

  const items = [];
  let subtotalBase = 0;
  for (const incoming of incomingItems) {
    const product = productMap.get(Number(incoming.id));
    if (!product) return json({ error: `Product ${incoming.id} not found` }, 400);
    if (product.status && product.status !== "published") return json({ error: `Product ${incoming.id} is unavailable` }, 400);
    const qty = Math.max(1, Math.round(Number(incoming.quantity) || 1));
    if (product.stock != null && qty > Number(product.stock)) return json({ error: `Insufficient stock for product ${incoming.id}` }, 400);
    const basePrice = Number(product.price || 0);
    subtotalBase += basePrice * qty;
    items.push({
      id: Number(product.id),
      name: (product.title_translations && product.title_translations.en) || product.title || "",
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

  const payload = {
    customer_name: `${firstName} ${lastName}`.trim(),
    customer_email: email,
    customer_phone: phone,
    shipping_address: { firstName, lastName, email, phone, country, city, address, postalCode: customer.postalCode || null, region: customer.region || null },
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

  // persist with column fallback
  let current = { ...payload };
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(current),
    });
    if (res.ok) {
      const data = await res.json();
      const orderId = Array.isArray(data) ? data[0]?.id : data?.id;
      return json({ orderId, total, currency });
    }
    const text = await res.text();
    const missing = extractMissingColumn(text);
    if (missing && Object.prototype.hasOwnProperty.call(current, missing)) {
      delete current[missing];
      continue;
    }
    return json({ error: text || "Failed to create order" }, 500);
  }
  return json({ error: "Could not create order: database schema mismatch" }, 500);
}

async function getRate(currency, env) {
  if (currency === "EUR") return 1;
  const key = env.EXCHANGE_RATE_API_KEY || "f309933485e263b0337b76ad";
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/EUR`);
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

function extractMissingColumn(message) {
  const patterns = [/Could not find the '([^']+)' column/i, /column "([^"]+)" of relation/i, /column '([^']+)' does not exist/i];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
