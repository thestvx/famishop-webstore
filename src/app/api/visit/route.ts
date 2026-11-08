import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function POST() {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  try {
    const { data: rows } = await supabase
      .from("products")
      .select("id,prices")
      .order("id", { ascending: true })
      .limit(1);
    const anchor = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!anchor) return NextResponse.json({ ok: false }, { status: 200 });

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

    const key = todayKey();
    const current =
      existingPrices.siteVisits != null
        ? Number(existingPrices.siteVisits)
        : Object.values(siteDailyViews).reduce((s: number, v: any) => s + (Number.isFinite(Number(v)) ? Number(v) : 0), 0);
    const next = (Number.isFinite(current) ? current : 0) + 1;
    siteDailyViews[key] = (Number.isFinite(Number(siteDailyViews[key])) ? Number(siteDailyViews[key]) : 0) + 1;

    const prices = { ...existingPrices, siteVisits: next, siteDailyViews };
    const { error } = await supabase.from("products").update({ prices }).eq("id", anchor.id);
    if (error) return NextResponse.json({ ok: false }, { status: 200 });
    return NextResponse.json({ ok: true, visits: next });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
