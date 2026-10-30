export async function onRequestGet(context) {
  const { env } = context;
  const access = env.BOXTAL_ACCESS_KEY;
  const secret = env.BOXTAL_SECRET_KEY;
  if (!access || !secret) {
    return json({ ok: false, error: "Boxtal credentials missing" }, 500);
  }
  const auth = btoa(`${access}:${secret}`);
  const params = new URLSearchParams({
    "colis_1.poids": "1",
    "colis_1.longueur": "30",
    "colis_1.largeur": "20",
    "colis_1.hauteur": "10",
    code_contenu: env.BOXTAL_CONTENT_CODE || "40110",
    "expediteur.pays": env.BOXTAL_SHIPPER_COUNTRY || "FR",
    "expediteur.code_postal": env.BOXTAL_SHIPPER_POSTAL_CODE || "75001",
    "expediteur.ville": env.BOXTAL_SHIPPER_CITY || "Paris",
    "expediteur.type": "entreprise",
    "destinataire.pays": "FR",
    "destinataire.code_postal": "75011",
    "destinataire.ville": "Paris",
    "destinataire.type": "particulier",
    collecte: new Date().toISOString().slice(0, 10),
  });
  try {
    const res = await fetch(`https://www.envoimoinscher.com/api/v1/cotation?${params.toString()}`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/xml" },
    });
    const xml = await res.text();
    const count = (xml.match(/<offer>/g) || []).length;
    return json({
      ok: res.ok,
      httpStatus: res.status,
      environment: "production (www.envoimoinscher.com)",
      offersCount: count,
      hasOffers: count > 0,
    });
  } catch (e) {
    return json({ ok: false, error: e?.message || "Request failed" }, 502);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
