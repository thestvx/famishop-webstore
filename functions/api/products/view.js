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
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const productId = Number(body?.productId);
  if (!Number.isFinite(productId) || productId <= 0) {
    return json({ ok: false, error: "Invalid product" }, 400);
  }

  try {
    const productRes = await fetch(
      `${supabaseUrl}/rest/v1/products?select=*&id=eq.${productId}&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (!productRes.ok) return json({ ok: false }, 200);
    const rows = await productRes.json();
    const product = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!product) return json({ ok: false }, 200);

    const existingPrices =
      product.prices && typeof product.prices === "object" && !Array.isArray(product.prices)
        ? product.prices
        : {};
    const dailyViews =
      existingPrices.dailyViews &&
      typeof existingPrices.dailyViews === "object" &&
      !Array.isArray(existingPrices.dailyViews)
        ? { ...existingPrices.dailyViews }
        : {};

    const now = new Date();
    const key = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;

    const current =
      product.views != null
        ? Number(product.views)
        : existingPrices.views != null
        ? Number(existingPrices.views)
        : Object.values(dailyViews).reduce(
            (sum, value) => sum + (Number.isFinite(Number(value)) ? Number(value) : 0),
            0
          );
    const next = (Number.isFinite(current) ? current : 0) + 1;
    dailyViews[key] = (Number.isFinite(Number(dailyViews[key])) ? Number(dailyViews[key]) : 0) + 1;

    const prices = { ...existingPrices, views: next, dailyViews };

    let res = await patchProduct(supabaseUrl, supabaseKey, productId, { views: next, prices });
    if (!res.ok) {
      res = await patchProduct(supabaseUrl, supabaseKey, productId, { prices });
    }
    if (!res.ok) {
      return json({ ok: false }, 200);
    }
    return json({ ok: true, views: next });
  } catch {
    return json({ ok: false }, 200);
  }
}

function patchProduct(supabaseUrl, supabaseKey, productId, payload) {
  return fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
    method: "PATCH",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
