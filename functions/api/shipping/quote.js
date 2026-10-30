const BOXTAL_BASE = "https://www.envoimoinscher.com/api/v1";

export async function onRequestPost(context) {
  const { request, env } = context;

  const access = env.BOXTAL_ACCESS_KEY;
  const secret = env.BOXTAL_SECRET_KEY;
  if (!access || !secret) {
    return json({ error: "Shipping is not configured (BOXTAL_ACCESS_KEY / BOXTAL_SECRET_KEY)" }, 500);
  }
  const auth = btoa(`${access}:${secret}`);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const country = String(body?.country || "").toUpperCase();
  if (country !== "FR" && country !== "IT") {
    return json({ error: "Shipping is only available to France and Italy" }, 400);
  }
  const postalCode = String(body?.postalCode || "").trim();
  const city = String(body?.city || "").trim();
  const incomingItems = Array.isArray(body?.items) ? body.items : [];
  if (!postalCode || !city) return json({ error: "Postal code and city are required" }, 400);
  if (!/^\d{5}$/.test(postalCode)) {
    return json({ error: "Invalid postal code for the selected country" }, 400);
  }
  if (incomingItems.length === 0) return json({ error: "Cart is empty" }, 400);

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "https://lahorqznlrzdlupveoja.supabase.co";
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaG9ycXpubHJ6ZGx1cHZlb2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjQzNjgsImV4cCI6MjEwODcwMDM2OH0.5qGE1B8hQUxW113xKEI6oW9NoIraAkmacMFbb1kCRws";
  const trustedItems = [...incomingItems];
  try {
    const ids = incomingItems.map((i) => Number(i.id)).filter((n) => Number.isFinite(n));
    if (ids.length) {
      const prodRes = await fetch(`${supabaseUrl}/rest/v1/products?select=*&id=in.(${ids.join(",")})`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      if (prodRes.ok) {
        const products = await prodRes.json();
        const map = new Map((products || []).map((p) => [Number(p.id), p]));
        for (let i = 0; i < trustedItems.length; i += 1) {
          const item = trustedItems[i];
          const product = map.get(Number(item.id));
          if (!product) continue;
          trustedItems[i] = {
            ...item,
            packageSize: product.package_size || item.packageSize || null,
            package_size: product.package_size || item.package_size || null,
            weightGrams: product.weight_grams != null ? Number(product.weight_grams) : (product.prices && product.prices.weightKg != null ? Math.round(Number(product.prices.weightKg) * 1000) : item.weightGrams),
            weight_grams: product.weight_grams != null ? Number(product.weight_grams) : (product.prices && product.prices.weightKg != null ? Math.round(Number(product.prices.weightKg) * 1000) : item.weight_grams),
            weightKg: product.weight_kg != null ? Number(product.weight_kg) : (product.prices && product.prices.weightKg != null ? Number(product.prices.weightKg) : item.weightKg),
            weight_kg: product.weight_kg != null ? Number(product.weight_kg) : (product.prices && product.prices.weightKg != null ? Number(product.prices.weightKg) : item.weight_kg),
            lengthCm: product.length_cm != null ? Number(product.length_cm) : item.lengthCm,
            length_cm: product.length_cm != null ? Number(product.length_cm) : item.length_cm,
            widthCm: product.width_cm != null ? Number(product.width_cm) : item.widthCm,
            width_cm: product.width_cm != null ? Number(product.width_cm) : item.width_cm,
            heightCm: product.height_cm != null ? Number(product.height_cm) : item.heightCm,
            height_cm: product.height_cm != null ? Number(product.height_cm) : item.height_cm,
          };
        }
      }
    }
  } catch {}

  const contentCode = env.BOXTAL_CONTENT_CODE || "40110";
  const shipperCountry = env.BOXTAL_SHIPPER_COUNTRY || "FR";
  const shipperPostal = env.BOXTAL_SHIPPER_POSTAL_CODE || "75001";
  const shipperCity = env.BOXTAL_SHIPPER_CITY || "Paris";
  const pkg = packageForItems(trustedItems, env);
  const params = new URLSearchParams({
    "colis_1.poids": String(pkg.weight),
    "colis_1.longueur": String(pkg.length),
    "colis_1.largeur": String(pkg.width),
    "colis_1.hauteur": String(pkg.height),
    code_contenu: contentCode,
    "expediteur.pays": shipperCountry,
    "expediteur.code_postal": shipperPostal,
    "expediteur.ville": shipperCity,
    "expediteur.type": "entreprise",
    "destinataire.pays": country,
    "destinataire.code_postal": postalCode,
    "destinataire.ville": city,
    "destinataire.type": "particulier",
    collecte: today(),
  });

  let xml = "";
  try {
    const res = await fetch(`${BOXTAL_BASE}/cotation?${params.toString()}`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/xml" },
    });
    xml = await res.text();
    if (!res.ok) {
      return json({ error: `Boxtal quote failed (${res.status})`, details: xml.slice(0, 500) }, 502);
    }
  } catch (e) {
    return json({ error: e?.message || "Boxtal quote failed" }, 502);
  }

  const offers = parseOffers(xml);
  const unique = [];
  const seen = new Set();
  for (const offer of offers.sort((a, b) => a.price - b.price)) {
    const key = `${offer.operator}:${offer.service}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(offer);
  }
  const ordered = [];
  const byCategory = (cat) => unique.filter((offer) => offer.category === cat).sort((a, b) => a.price - b.price);
  for (const cat of ["domicile", "relais", "express"]) {
    ordered.push(...byCategory(cat));
  }
  const final = ordered.length ? ordered : unique;

  if (final.length === 0) {
    return json({ error: "No shipping options are available for this address" }, 404);
  }

  return json({
    offers: final,
    package: pkg,
    origin: { country: shipperCountry, postalCode: shipperPostal, city: shipperCity },
  });
}

const SIZE_MAP = {
  small: { weight: 0.3, length: 20, width: 15, height: 5 },
  medium: { weight: 0.8, length: 30, width: 20, height: 10 },
  large: { weight: 1.5, length: 40, width: 30, height: 20 },
};

function itemWeightKg(item) {
  if (item.weightKg != null && Number(item.weightKg) > 0) return Number(item.weightKg);
  if (item.weight_kg != null && Number(item.weight_kg) > 0) return Number(item.weight_kg);
  if (item.weightGrams != null && Number(item.weightGrams) > 0) return Number(item.weightGrams) / 1000;
  if (item.weight_grams != null && Number(item.weight_grams) > 0) return Number(item.weight_grams) / 1000;
  return 0;
}

function sizeFor(item) {
  const w = itemWeightKg(item);
  if (w > 0) {
    const l = Number(item.lengthCm || item.length_cm) > 0 ? Number(item.lengthCm || item.length_cm) : 0;
    const wd = Number(item.widthCm || item.width_cm) > 0 ? Number(item.widthCm || item.width_cm) : 0;
    const h = Number(item.heightCm || item.height_cm) > 0 ? Number(item.heightCm || item.height_cm) : 0;
    if (l && wd && h) return { weight: w, length: l, width: wd, height: h };
    const key = String(item.packageSize || item.package_size || "").toLowerCase();
    const s = SIZE_MAP[key] || SIZE_MAP.medium;
    return { weight: w, length: s.length, width: s.width, height: s.height };
  }
  const key = String(item.packageSize || item.package_size || "").toLowerCase();
  return SIZE_MAP[key] || SIZE_MAP.medium;
}

function packageForItems(items, env) {
  const quantity = items.reduce(
    (sum, item) => sum + Math.max(1, Math.round(Number(item.quantity) || 1)),
    0
  );
  let weight = 0;
  let length = 0;
  let width = 0;
  let height = 0;
  for (const item of items) {
    const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
    const s = sizeFor(item);
    weight += s.weight * qty;
    length = Math.max(length, s.length);
    width = Math.max(width, s.width);
    height = Math.max(height, s.height);
  }
  const packaging = Number((env && env.BOXTAL_PACKAGING_WEIGHT_KG) || 0);
  weight = weight + (Number.isFinite(packaging) ? packaging : 0);
  weight = Math.max(0.1, Math.round(weight * 1000) / 1000);
  length = length || 30;
  width = width || 20;
  height = height || 10;
  return { weight, length, width, height, quantity };
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? match[1] : "";
}

function decodeXml(value) {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function categorizeOffer(deliveryType, carrier, service, label) {
  if (deliveryType === "PICKUP_POINT") return "relais";
  const text = `${carrier} ${service} ${label}`.toLowerCase();
  if (/express/.test(text)) return "express";
  return "domicile";
}

function parseOffers(xml) {
  return [...xml.matchAll(/<offer>([\s\S]*?)<\/offer>/g)]
    .map((match) => {
      const block = match[1];
      const operatorBlock = tag(block, "operator");
      const serviceBlock = tag(block, "service");
      const priceBlock = tag(block, "price");
      const deliveryBlock = tag(block, "delivery");
      const deliveryTypeBlock = tag(deliveryBlock, "type");
      const carrier = decodeXml(tag(operatorBlock, "label"));
      const service = tag(serviceBlock, "code");
      const label = decodeXml(tag(serviceBlock, "label"));
      const deliveryType = tag(deliveryTypeBlock, "code");
      return {
        operator: tag(operatorBlock, "code"),
        carrier,
        service,
        label,
        price: Number(tag(priceBlock, "tax-inclusive") || 0),
        currency: tag(priceBlock, "currency") || "EUR",
        deliveryType,
        deliveryDate: tag(deliveryBlock, "date") || null,
        deliveryLabel: decodeXml(tag(deliveryBlock, "label")) || null,
        category: categorizeOffer(deliveryType, carrier, service, label),
      };
    })
    .filter((offer) => offer.operator && offer.service && Number.isFinite(offer.price) && offer.price > 0);
}

function today() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
