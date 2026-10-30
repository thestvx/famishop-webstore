import { NextResponse } from "next/server";

const BOXTAL_BASE = "https://www.envoimoinscher.com/api/v1";

export async function GET() {
  const access = process.env.BOXTAL_ACCESS_KEY;
  const secret = process.env.BOXTAL_SECRET_KEY;
  if (!access || !secret) {
    return NextResponse.json({ ok: false, error: "Boxtal credentials missing" }, { status: 500 });
  }
  const auth = Buffer.from(`${access}:${secret}`).toString("base64");
  const params = new URLSearchParams({
    "colis_1.poids": "1",
    "colis_1.longueur": "30",
    "colis_1.largeur": "20",
    "colis_1.hauteur": "10",
    code_contenu: process.env.BOXTAL_CONTENT_CODE || "40110",
    "expediteur.pays": process.env.BOXTAL_SHIPPER_COUNTRY || "FR",
    "expediteur.code_postal": process.env.BOXTAL_SHIPPER_POSTAL_CODE || "75001",
    "expediteur.ville": process.env.BOXTAL_SHIPPER_CITY || "Paris",
    "expediteur.type": "entreprise",
    "destinataire.pays": "FR",
    "destinataire.code_postal": "75011",
    "destinataire.ville": "Paris",
    "destinataire.type": "particulier",
    collecte: new Date().toISOString().slice(0, 10),
  });
  try {
    const res = await fetch(`${BOXTAL_BASE}/cotation?${params.toString()}`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/xml" },
      cache: "no-store",
    });
    const xml = await res.text();
    const count = (xml.match(/<offer>/g) || []).length;
    return NextResponse.json({
      ok: res.ok,
      httpStatus: res.status,
      environment: "production (www.envoimoinscher.com)",
      offersCount: count,
      hasOffers: count > 0,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Request failed" }, { status: 502 });
  }
}
