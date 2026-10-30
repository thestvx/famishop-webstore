import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type IncomingItem = {
  id: number | string;
  quantity: number;
  packageSize?: string | null;
  weightGrams?: number | null;
  weightKg?: number | null;
  weight_kg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
};

type QuoteOffer = {
  operator: string;
  carrier: string;
  service: string;
  label: string;
  price: number;
  currency: string;
  deliveryType: string;
  deliveryDate: string | null;
  deliveryLabel: string | null;
  category: "domicile" | "relais" | "express";
};

const BOXTAL_BASE = "https://www.envoimoinscher.com/api/v1";
const CONTENT_CODE = process.env.BOXTAL_CONTENT_CODE || "40110";
const SHIPPER_COUNTRY = process.env.BOXTAL_SHIPPER_COUNTRY || "FR";
const SHIPPER_POSTAL = process.env.BOXTAL_SHIPPER_POSTAL_CODE || "75001";
const SHIPPER_CITY = process.env.BOXTAL_SHIPPER_CITY || "Paris";
const PACKAGING_WEIGHT_KG = Number(process.env.BOXTAL_PACKAGING_WEIGHT_KG || 0);

function credentials() {
  const access = process.env.BOXTAL_ACCESS_KEY;
  const secret = process.env.BOXTAL_SECRET_KEY;
  if (!access || !secret) return null;
  return Buffer.from(`${access}:${secret}`).toString("base64");
}

const SIZE_MAP: Record<string, { weight: number; length: number; width: number; height: number }> = {
  small: { weight: 0.3, length: 20, width: 15, height: 5 },
  medium: { weight: 0.8, length: 30, width: 20, height: 10 },
  large: { weight: 1.5, length: 40, width: 30, height: 20 },
};

function itemWeightKg(item: IncomingItem): number {
  if (item.weightKg != null && Number(item.weightKg) > 0) return Number(item.weightKg);
  if (item.weight_kg != null && Number(item.weight_kg) > 0) return Number(item.weight_kg);
  if (item.weightGrams != null && Number(item.weightGrams) > 0) return Number(item.weightGrams) / 1000;
  return 0;
}

function sizeFor(item: IncomingItem) {
  const w = itemWeightKg(item);
  if (w > 0) {
    const l = item.lengthCm && item.lengthCm > 0 ? item.lengthCm : 0;
    const wd = item.widthCm && item.widthCm > 0 ? item.widthCm : 0;
    const h = item.heightCm && item.heightCm > 0 ? item.heightCm : 0;
    if (l && wd && h) {
      return { weight: w, length: l, width: wd, height: h };
    }
    const key = String(item.packageSize || "").toLowerCase();
    const s = SIZE_MAP[key] || SIZE_MAP.medium;
    return { weight: w, length: s.length, width: s.width, height: s.height };
  }
  const key = String(item.packageSize || "").toLowerCase();
  return SIZE_MAP[key] || SIZE_MAP.medium;
}

function packageForItems(items: IncomingItem[]) {
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
  weight = weight + (Number.isFinite(PACKAGING_WEIGHT_KG) ? PACKAGING_WEIGHT_KG : 0);
  weight = Math.max(0.1, Math.round(weight * 1000) / 1000);
  length = length || 30;
  width = width || 20;
  height = height || 10;
  return { weight, length, width, height, quantity };
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? match[1] : "";
}

function decodeXml(value: string): string {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function categorizeOffer(
  deliveryType: string,
  carrier: string,
  service: string,
  label: string
): "domicile" | "relais" | "express" {
  if (deliveryType === "PICKUP_POINT") return "relais";
  const text = `${carrier} ${service} ${label}`.toLowerCase();
  if (/express/.test(text)) return "express";
  return "domicile";
}

function parseOffers(xml: string): QuoteOffer[] {
  const blocks = Array.from(xml.matchAll(/<offer>([\s\S]*?)<\/offer>/g)).map((match) => match[1]);
  return blocks
    .map((block) => {
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
        category: categorizeOffer(
          tag(deliveryTypeBlock, "code"),
          decodeXml(tag(operatorBlock, "label")),
          tag(serviceBlock, "code"),
          decodeXml(tag(serviceBlock, "label"))
        ),
      };
    })
    .filter((offer) => offer.operator && offer.service && Number.isFinite(offer.price) && offer.price > 0);
}

function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function POST(req: Request) {
  const auth = credentials();
  if (!auth) {
    return NextResponse.json(
      { error: "Shipping is not configured (BOXTAL_ACCESS_KEY / BOXTAL_SECRET_KEY)" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const country = String(body?.country || "").toUpperCase();
  if (country !== "FR" && country !== "IT") {
    return NextResponse.json({ error: "Shipping is only available to France and Italy" }, { status: 400 });
  }
  const postalCode = String(body?.postalCode || "").trim();
  const city = String(body?.city || "").trim();
  const incomingItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  if (!postalCode || !city) {
    return NextResponse.json({ error: "Postal code and city are required" }, { status: 400 });
  }
  if (!/^\d{5}$/.test(postalCode)) {
    return NextResponse.json({ error: "Invalid postal code for the selected country" }, { status: 400 });
  }
  if (incomingItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Resolve trusted product data from the database instead of trusting browser weights.
  const trustedItems: IncomingItem[] = [...incomingItems];
  if (isSupabaseConfigured() && supabase) {
    const ids = incomingItems.map((i) => Number(i.id)).filter((n) => Number.isFinite(n));
    if (ids.length) {
      const { data } = await supabase.from("products").select("*").in("id", ids);
      const map = new Map((data || []).map((p: any) => [Number(p.id), p]));
      for (let i = 0; i < trustedItems.length; i += 1) {
        const item = trustedItems[i];
        const product: any = map.get(Number(item.id));
        if (!product) continue;
        trustedItems[i] = {
          ...item,
          packageSize: product.package_size || item.packageSize || null,
          weightGrams: product.weight_grams != null ? Number(product.weight_grams) : product.prices?.weightKg != null ? Math.round(Number(product.prices.weightKg) * 1000) : item.weightGrams,
          weightKg: product.weight_kg != null ? Number(product.weight_kg) : product.weight_grams != null ? Number(product.weight_grams) / 1000 : product.prices?.weightKg != null ? Number(product.prices.weightKg) : item.weightKg,
          weight_kg: product.weight_kg != null ? Number(product.weight_kg) : product.prices?.weightKg != null ? Number(product.prices.weightKg) : item.weight_kg,
          lengthCm: product.length_cm != null ? Number(product.length_cm) : item.lengthCm,
          widthCm: product.width_cm != null ? Number(product.width_cm) : item.widthCm,
          heightCm: product.height_cm != null ? Number(product.height_cm) : item.heightCm,
        };
      }
    }
  }

  const pkg = packageForItems(trustedItems);
  const params = new URLSearchParams({
    "colis_1.poids": String(pkg.weight),
    "colis_1.longueur": String(pkg.length),
    "colis_1.largeur": String(pkg.width),
    "colis_1.hauteur": String(pkg.height),
    code_contenu: CONTENT_CODE,
    "expediteur.pays": SHIPPER_COUNTRY,
    "expediteur.code_postal": SHIPPER_POSTAL,
    "expediteur.ville": SHIPPER_CITY,
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
      cache: "no-store",
    });
    xml = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `Boxtal quote failed (${res.status})`, details: xml.slice(0, 500) },
        { status: 502 }
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Boxtal quote failed" }, { status: 502 });
  }

  const offers = parseOffers(xml);
  const unique: QuoteOffer[] = [];
  const seen = new Set<string>();
  // Keep all delivery modes (home + pickup point) so the customer can choose.
  for (const offer of offers.sort((a, b) => a.price - b.price)) {
    const key = `${offer.operator}:${offer.service}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(offer);
  }
  // Ensure each category is represented: prefer cheapest per category first.
  const ordered: QuoteOffer[] = [];
  const byCategory = (cat: QuoteOffer["category"]) =>
    unique.filter((offer) => offer.category === cat).sort((a, b) => a.price - b.price);
  for (const cat of ["domicile", "relais", "express"] as const) {
    ordered.push(...byCategory(cat));
  }
  const final = ordered.length ? ordered : unique;

  if (final.length === 0) {
    return NextResponse.json(
      { error: "No shipping options are available for this address" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    offers: final,
    package: pkg,
    origin: { country: SHIPPER_COUNTRY, postalCode: SHIPPER_POSTAL, city: SHIPPER_CITY },
  });
}
