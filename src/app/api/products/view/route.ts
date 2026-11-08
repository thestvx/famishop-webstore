import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function todayKey() {
  const d = new Date();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}-${day}`;
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 200 });
  }
  const body = await req.json().catch(() => ({}));
  const productId = Number(body?.productId);
  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid product" }, { status: 400 });
  }

  try {
    const { data: product } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
    if (!product) return NextResponse.json({ ok: false }, { status: 200 });
    if (product.title === "__famishop_site_stats__" || product.prices?.__analytics === true) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const existingPrices =
      product.prices && typeof product.prices === "object" && !Array.isArray(product.prices)
        ? product.prices
        : {};
    const dailyViews =
      existingPrices.dailyViews && typeof existingPrices.dailyViews === "object" && !Array.isArray(existingPrices.dailyViews)
        ? { ...existingPrices.dailyViews }
        : {};

    const key = todayKey();
    const current =
      product.views != null
        ? Number(product.views)
        : existingPrices.views != null
        ? Number(existingPrices.views)
        : Object.values(dailyViews).reduce((s: number, v: any) => s + (Number.isFinite(Number(v)) ? Number(v) : 0), 0);
    const next = (Number.isFinite(current) ? current : 0) + 1;
    dailyViews[key] = (Number.isFinite(Number(dailyViews[key])) ? Number(dailyViews[key]) : 0) + 1;

    const prices = { ...existingPrices, views: next, dailyViews };

    const { error } = await supabase.from("products").update({ views: next, prices }).eq("id", productId);
    if (error) {
      await supabase.from("products").update({ prices }).eq("id", productId);
    }
    return NextResponse.json({ ok: true, views: next });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
