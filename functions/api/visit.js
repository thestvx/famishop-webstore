export async function onRequestPost(context) {
  const { env } = context;
  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    "https://lahorqznlrzdlupveoja.supabase.co";
  const supabaseKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaG9ycXpubHJ6ZGx1cHZlb2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjQzNjgsImV4cCI6MjEwODcwMDM2OH0.5qGE1B8hQUxW113xKEI6oW9NoIraAkmacMFbb1kCRws";

  try {
    const anchorRes = await fetch(
      `${supabaseUrl}/rest/v1/products?select=id,prices&order=id.asc&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (!anchorRes.ok) return json({ ok: false }, 200);
    const rows = await anchorRes.json();
    const anchor = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!anchor) return json({ ok: false }, 200);

    const existingPrices =
      anchor.prices && typeof anchor.prices === "object" && !Array.isArray(anchor.prices)
        ? anchor.prices
        : {};
    const siteDailyViews =
      existingPrices.siteDailyViews &&
      typeof existingPrices.siteDailyViews === "object" &&
      !Array.isArray(existingPrices.siteDailyViews)
        ? { ...existingPrices.siteDailyViews }
        : {};

    const now = new Date();
    const key = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    const current =
      existingPrices.siteVisits != null
        ? Number(existingPrices.siteVisits)
        : Object.values(siteDailyViews).reduce(
            (sum, value) => sum + (Number.isFinite(Number(value)) ? Number(value) : 0),
            0
          );
    const next = (Number.isFinite(current) ? current : 0) + 1;
    siteDailyViews[key] = (Number.isFinite(Number(siteDailyViews[key])) ? Number(siteDailyViews[key]) : 0) + 1;

    const prices = { ...existingPrices, siteVisits: next, siteDailyViews };
    const res = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${anchor.id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ prices }),
    });
    if (!res.ok) return json({ ok: false }, 200);
    return json({ ok: true, visits: next });
  } catch {
    return json({ ok: false }, 200);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
