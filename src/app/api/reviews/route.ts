import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  const productId = Number(body?.productId);
  const rating = Number(body?.rating);
  const content = String(body?.content || "").trim();
  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const { data: product, error } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
  if (error || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const reviews = Array.isArray(product.reviews)
    ? product.reviews
    : product.prices && Array.isArray(product.prices.reviews)
    ? product.prices.reviews
    : [];

  const newReview = {
    id: Date.now(),
    user: "Customer",
    content,
    rating,
    date: new Date().toISOString().slice(0, 10),
  };
  const updated = [...reviews, newReview];

  // Try direct column, fallback to prices.reviews
  const payload: any = { reviews: updated };
  const prices = product.prices && typeof product.prices === "object" ? { ...product.prices, reviews: updated } : { reviews: updated };
  payload.prices = prices;

  const { error: upErr } = await supabase.from("products").update(payload).eq("id", productId);
  if (upErr) {
    // fallback: try only prices
    const { error: upErr2 } = await supabase.from("products").update({ prices }).eq("id", productId);
    if (upErr2) {
      return NextResponse.json({ error: upErr2.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, review: newReview });
}
