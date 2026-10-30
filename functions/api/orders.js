export async function onRequestPost(context) {
  const { request, env } = context;
  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    "https://lahorqznlrzdlupveoja.supabase.co";
  const supabaseKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaG9ycXpubHJ6ZGx1cHZlb2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjQzNjgsImV4cCI6MjEwODcwMDM2OH0.5qGE1B8hQUxW113xKEI6oW9NoIraAkmacMFbb1kCRws";

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
  const shippingItems = incomingItems.map((inc) => {
    const product = productMap.get(Number(inc.id));
    return {
      ...inc,
      packageSize: (product && (product.package_size || product.packageSize)) || null,
    };
  });
  const shippingSelection = body?.shipping || {};
  const shippingBase = await resolveShippingBase({
    country,
    postalCode: String(customer.postalCode || "").trim(),
    city,
    items: shippingItems,
    selected: {
      operator: shippingSelection.operator,
      service: shippingSelection.service,
      price: shippingSelection.price,
    },
    env,
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

  const payload = {
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

  // persist with column fallback
  let current = { ...payload };
  for (let attempt = 0; attempt < 30; attempt++) {
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

const BOXTAL_BASE = "https://www.envoimoinscher.com/api/v1";

function xmlTag(block, name) {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? match[1] : "";
}

function round(value) {
  return Math.round(value * 100) / 100;
}

async function resolveShippingBase(input) {
  const fallback = Math.max(0, Math.min(500, Number(input.selected?.price) || 0));
  const access = input.env.BOXTAL_ACCESS_KEY;
  const secret = input.env.BOXTAL_SECRET_KEY;
  if (!access || !secret) return fallback;
  if (input.country !== "FR" && input.country !== "IT") return fallback;
  if (!input.postalCode || !input.city) return fallback;

  const SIZE_MAP = {
    small: { weight: 0.3, length: 20, width: 15, height: 5 },
    medium: { weight: 0.8, length: 30, width: 20, height: 10 },
    large: { weight: 1.5, length: 40, width: 30, height: 20 },
  };
  try {
    let weight = 0;
    let length = 0;
    let width = 0;
    let height = 0;
    const quantity = input.items.reduce(
      (sum, item) => sum + Math.max(1, Math.round(Number(item.quantity) || 1)),
      0
    );
    for (const item of input.items) {
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      const key = String((item && (item.packageSize || item.package_size)) || "").toLowerCase();
      const s = SIZE_MAP[key] || SIZE_MAP.medium;
      weight += s.weight * qty;
      length = Math.max(length, s.length);
      width = Math.max(width, s.width);
      height = Math.max(height, s.height);
    }
    weight = Math.max(0.1, Math.round(weight * 10) / 10);
    if (weight < 1) weight = 1;
    length = length || 30;
    width = width || 20;
    height = height || 10;
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const params = new URLSearchParams({
      "colis_1.poids": String(weight),
      "colis_1.longueur": String(length),
      "colis_1.largeur": String(width),
      "colis_1.hauteur": String(height),
      code_contenu: input.env.BOXTAL_CONTENT_CODE || "40110",
      "expediteur.pays": input.env.BOXTAL_SHIPPER_COUNTRY || "FR",
      "expediteur.code_postal": input.env.BOXTAL_SHIPPER_POSTAL_CODE || "75001",
      "expediteur.ville": input.env.BOXTAL_SHIPPER_CITY || "Paris",
      "expediteur.type": "entreprise",
      "destinataire.pays": input.country,
      "destinataire.code_postal": input.postalCode,
      "destinataire.ville": input.city,
      "destinataire.type": "particulier",
      collecte: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    });
    const auth = btoa(`${access}:${secret}`);
    const res = await fetch(`${BOXTAL_BASE}/cotation?${params.toString()}`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/xml" },
    });
    if (!res.ok) return fallback;
    const xml = await res.text();
    const offers = [...xml.matchAll(/<offer>([\s\S]*?)<\/offer>/g)].map((match) => {
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
