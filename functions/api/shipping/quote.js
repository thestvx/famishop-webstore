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

  const contentCode = env.BOXTAL_CONTENT_CODE || "40110";
  const shipperCountry = env.BOXTAL_SHIPPER_COUNTRY || "FR";
  const shipperPostal = env.BOXTAL_SHIPPER_POSTAL_CODE || "75001";
  const shipperCity = env.BOXTAL_SHIPPER_CITY || "Paris";
  const pkg = packageForItems(incomingItems);
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

function sizeFor(item) {
  const key = String(item.packageSize || "").toLowerCase();
  return SIZE_MAP[key] || SIZE_MAP.medium;
}

function packageForItems(items) {
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
  weight = Math.max(0.1, Math.round(weight * 10) / 10);
  if (weight < 1) weight = 1;
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
