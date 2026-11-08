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

  const productId = Number(body?.productId);
  const rating = Number(body?.rating);
  const content = String(body?.content || "").trim();
  if (!Number.isFinite(productId) || productId <= 0) {
    return json({ error: "Invalid product" }, 400);
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return json({ error: "Invalid rating" }, 400);
  }

  try {
    const productRes = await fetch(
      `${supabaseUrl}/rest/v1/products?select=*&id=eq.${productId}&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (!productRes.ok) return json({ error: "Product not found" }, 404);
    const rows = await productRes.json();
    const product = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!product) return json({ error: "Product not found" }, 404);

    const existingPrices =
      product.prices && typeof product.prices === "object" && !Array.isArray(product.prices)
        ? product.prices
        : {};
    const reviews = Array.isArray(product.reviews)
      ? product.reviews
      : Array.isArray(existingPrices.reviews)
      ? existingPrices.reviews
      : [];

    const newReview = {
      id: Date.now(),
      user: String(body?.user || "Customer").slice(0, 80),
      content,
      rating,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [...reviews, newReview];
    const prices = { ...existingPrices, reviews: updated };

    let res = await patchProduct(supabaseUrl, supabaseKey, productId, { reviews: updated, prices });
    if (!res.ok) {
      res = await patchProduct(supabaseUrl, supabaseKey, productId, { prices });
    }
    if (!res.ok) {
      return json({ error: "Could not save review" }, 500);
    }
    return json({ ok: true, review: newReview });
  } catch (e) {
    return json({ error: e?.message || "Failed" }, 500);
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
