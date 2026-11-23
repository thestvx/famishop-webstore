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
  const userId = body?.userId ? String(body.userId) : null;
  const userName = body?.userName ? String(body.userName) : "Customer";
  const userEmail = body?.userEmail ? String(body.userEmail).toLowerCase() : null;
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
  if (product.title === "__famishop_site_stats__" || product.prices?.__analytics === true) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const reviews = Array.isArray(product.reviews)
    ? product.reviews
    : product.prices && Array.isArray(product.prices.reviews)
    ? product.prices.reviews
    : [];

  if (userId && reviews.some((r: any) => String(r.userId || "") === userId)) {
    return NextResponse.json({ error: "You have already reviewed this product." }, { status: 409 });
  }

  let verifiedPurchase = false;
  if (userId || userEmail) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id,status,items,customer_uid,customer_email")
      .or(userId ? `customer_uid.eq.${userId}` : `customer_email.eq.${userEmail}`);
    verifiedPurchase = (orders || []).some((order: any) => {
      const status = String(order.status || "").toLowerCase();
      if (!["completed", "processing", "paid", "shipped", "delivered"].includes(status)) return false;
      const items = Array.isArray(order.items) ? order.items : [];
      return items.some((it: any) => Number(it.id) === productId);
    });
  }

  const newReview = {
    id: Date.now(),
    user: userName,
    userId,
    userEmail,
    content,
    rating,
    date: new Date().toISOString().slice(0, 10),
    verifiedPurchase,
  };
  const updated = [...reviews, newReview];
  const avgRating = updated.reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / updated.length;

  // Try direct column, fallback to prices.reviews
  const payload: any = { reviews: updated, rating: avgRating };
  const prices = product.prices && typeof product.prices === "object" ? { ...product.prices, reviews: updated, rating: avgRating } : { reviews: updated, rating: avgRating };
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
