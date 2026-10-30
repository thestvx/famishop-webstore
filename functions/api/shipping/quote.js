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
  if (incomingItems.length === 0) return json({ error: "Cart is empty" }, 400);

  const contentCode = env.BOXTAL_CONTENT_CODE || "40110";
  const shipperCountry = env.BOXTAL_SHIPPER_COUNTRY || "FR";
  const shipperPostal = env.BOXTAL_SHIPPER_POSTAL_CODE || "75001";
  const shipperCity = env.BOXTAL_SHIPPER_CITY || "Paris";
  const itemWeight = Number(env.BOXTAL_DEFAULT_ITEM_WEIGHT_KG || 0.5);

  const pkg = packageForItems(incomingItems, itemWeight);
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
  const homeOffers = offers.filter((offer) => offer.deliveryType === "HOME");
  const list = (homeOffers.length ? homeOffers : offers).sort((a, b) => a.price - b.price);
  const unique = [];
  const seen = new Set();
  for (const offer of list) {
    const key = `${offer.operator}:${offer.service}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(offer);
    if (unique.length >= 6) break;
  }

  if (unique.length === 0) {
    return json({ error: "No shipping options are available for this address" }, 404);
  }

  return json({
    offers: unique,
    package: pkg,
    origin: { country: shipperCountry, postalCode: shipperPostal, city: shipperCity },
  });
}

function packageForItems(items, itemWeight) {
  const quantity = items.reduce(
    (sum, item) => sum + Math.max(1, Math.round(Number(item.quantity) || 1)),
    0
  );
  const weight = Math.max(1, Math.round(quantity * itemWeight * 10) / 10);
  return { weight, length: 30, width: 20, height: 10, quantity };
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

function parseOffers(xml) {
  return [...xml.matchAll(/<offer>([\s\S]*?)<\/offer>/g)]
    .map((match) => {
      const block = match[1];
      const operatorBlock = tag(block, "operator");
      const serviceBlock = tag(block, "service");
      const priceBlock = tag(block, "price");
      const deliveryBlock = tag(block, "delivery");
      const deliveryTypeBlock = tag(deliveryBlock, "type");
      return {
        operator: tag(operatorBlock, "code"),
        carrier: decodeXml(tag(operatorBlock, "label")),
        service: tag(serviceBlock, "code"),
        label: decodeXml(tag(serviceBlock, "label")),
        price: Number(tag(priceBlock, "tax-inclusive") || 0),
        currency: tag(priceBlock, "currency") || "EUR",
        deliveryType: tag(deliveryTypeBlock, "code"),
        deliveryDate: tag(deliveryBlock, "date") || null,
        deliveryLabel: decodeXml(tag(deliveryBlock, "label")) || null,
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
