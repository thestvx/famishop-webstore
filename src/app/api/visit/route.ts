import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

async function findAnchor() {
  if (!supabase) return null;
  const { data: analytics } = await supabase
    .from("products")
    .select("id,prices")
    .filter("prices->>__analytics", "eq", "true")
    .limit(1);
  if (Array.isArray(analytics) && analytics.length) return analytics[0];

  const { data: legacy } = await supabase
    .from("products")
    .select("id,prices")
    .order("id", { ascending: true })
    .limit(1);
  return Array.isArray(legacy) && legacy.length ? legacy[0] : null;
}

export async function POST(req: Request) {
  const referer = req.headers.get("referer") || "";
  if (referer.includes("/admin")) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      const anchor = await findAnchor();
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
          : Object.values(siteDailyViews).reduce(
              (s: number, v: any) => s + (Number.isFinite(Number(v)) ? Number(v) : 0),
              0
            );
      const safeCurrent = Number.isFinite(current) ? current : 0;
      const next = safeCurrent + 1;
      siteDailyViews[key] = (Number.isFinite(Number(siteDailyViews[key])) ? Number(siteDailyViews[key]) : 0) + 1;

      const prices = { ...existingPrices, siteVisits: next, siteDailyViews };
      let query = supabase.from("products").update({ prices }).eq("id", anchor.id);
      query =
        existingPrices.siteVisits != null
          ? query.filter("prices->>siteVisits", "eq", String(safeCurrent))
          : query.filter("prices->>siteVisits", "is", null);
      const { data: updated, error } = await query.select("id");
      if (!error && Array.isArray(updated) && updated.length === 1) {
        return NextResponse.json({ ok: true, visits: next });
      }
      await new Promise((r) => setTimeout(r, 20 + Math.floor(Math.random() * 60)));
    }
    return NextResponse.json({ ok: false }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
