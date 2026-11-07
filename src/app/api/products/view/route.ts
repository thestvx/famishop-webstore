import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  const productId = Number(body?.productId);
  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const { data: product } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = product.views != null ? Number(product.views) : product.prices?.views != null ? Number(product.prices.views) : 0;
  const next = current + 1;

  const prices = product.prices && typeof product.prices === "object" ? { ...product.prices, views: next } : { views: next };
  const payload: any = { views: next, prices };

  const { error } = await supabase.from("products").update(payload).eq("id", productId);
  if (error) {
    const { error: e2 } = await supabase.from("products").update({ prices }).eq("id", productId);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, views: next });
}
