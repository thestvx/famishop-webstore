"use client";

import React, { useCallback, useEffect, useState } from "react";
import { newArrivalsData, topSellingData, relatedProductData } from "@/lib/data/products";
import { Package, ShoppingCart, Users, DollarSign, Eye, TrendingUp } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isAnalyticsProduct } from "@/lib/productsStore";
import ProductImage, { PRODUCT_IMAGE_FALLBACK } from "@/components/common/ProductImage";

const fallbackProducts = [
  ...newArrivalsData,
  ...topSellingData,
  ...relatedProductData,
];

export default function AdminOverviewPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    if (!isSupabaseConfigured() || !supabase) {
      setProducts(fallbackProducts);
      setOrders([]);
      setCustomers([]);
      setLoading(false);
      setLastUpdated(new Date());
      return;
    }
    try {
      const [prodRes, orderRes, custRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*"),
        supabase.from("customers").select("*"),
      ]);
      if (prodRes.data) setProducts(prodRes.data);
      if (orderRes.data) setOrders(orderRes.data);
      if (custRes.data) setCustomers(custRes.data);
    } catch (e) {
      // keep empty/partial
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    load(true);
    const id = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        load(false);
      }
    }, 20000);
    return () => clearInterval(id);
  }, [load]);

  const analyticsProduct = products.find((p: any) => isAnalyticsProduct(p));
  const realProducts = products.filter((p: any) => !isAnalyticsProduct(p));

  const totalProducts = realProducts.length;
  const totalOrders = orders.length;

  const totalViews = realProducts.reduce((sum: number, p: any) => {
    const v = p.views != null ? Number(p.views) : p.prices?.views != null ? Number(p.prices.views) : 0;
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);
  const mostViewed = [...realProducts].sort((a: any, b: any) => {
    const va = a.views != null ? Number(a.views) : a.prices?.views != null ? Number(a.prices.views) : 0;
    const vb = b.views != null ? Number(b.views) : b.prices?.views != null ? Number(b.prices.views) : 0;
    return vb - va;
  })[0];

  const siteStatsProduct =
    analyticsProduct ||
    realProducts.find(
      (p: any) =>
        p.prices &&
        typeof p.prices === "object" &&
        (p.prices.siteVisits != null || (p.prices.siteDailyViews && typeof p.prices.siteDailyViews === "object"))
    );
  const siteDailyViews: Record<string, number> =
    siteStatsProduct?.prices?.siteDailyViews &&
    typeof siteStatsProduct.prices.siteDailyViews === "object" &&
    !Array.isArray(siteStatsProduct.prices.siteDailyViews)
      ? siteStatsProduct.prices.siteDailyViews
      : {};
  const siteTotal = siteStatsProduct?.prices?.siteVisits != null
    ? Number(siteStatsProduct.prices.siteVisits)
    : Object.values(siteDailyViews).reduce(
        (s: number, v: any) => s + (Number.isFinite(Number(v)) ? Number(v) : 0),
        0
      );
  const storeVisits = siteStatsProduct ? siteTotal : totalViews;

  // count unique customers by email/id if possible
  const uniqueCustomers = new Set();
  if (customers.length > 0) {
    customers.forEach((c: any) => {
      if (c.email) uniqueCustomers.add(c.email.toLowerCase());
      else if (c.id) uniqueCustomers.add(String(c.id));
    });
  } else {
    // fallback: unique from orders.customer
    orders.forEach((o: any) => {
      if (o.customer) uniqueCustomers.add(String(o.customer).toLowerCase());
    });
  }
  const totalCustomers = uniqueCustomers.size;

  // revenue: sum orders where status indicates paid/completed if exists; else sum all non-cancelled? be conservative
  let revenue = 0;
  orders.forEach((o: any) => {
    const status = (o.status || "").toLowerCase();
    if (status === "cancelled" || status === "canceled" || status === "refunded") return;
    const t = Number(o.total || o.amount || 0);
    if (!isNaN(t)) revenue += t;
  });

  const stats = [
    { label: "Total Products", value: totalProducts, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "bg-green-50 text-green-600" },
    { label: "Customers", value: totalCustomers, icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Revenue", value: revenue, icon: DollarSign, color: "bg-orange-50 text-orange-600", prefix: "" },
    { label: "Store Visits", value: storeVisits, icon: Eye, color: "bg-cyan-50 text-cyan-600", prefix: "" },
  ];

  const topViewed = [...realProducts]
    .map((p: any) => ({
      title: p.title,
      srcUrl: p.src_url || p.srcUrl || "",
      views: p.views != null ? Number(p.views) : p.prices?.views != null ? Number(p.prices.views) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  const maxViewed = Math.max(1, ...topViewed.map((p) => p.views));

  const statusCounts: Record<string, number> = {};
  orders.forEach((o: any) => {
    const key = String(o.status || "pending").toLowerCase();
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  });
  const statusEntries = Object.entries(statusCounts);
  const statusColors = ["#111111", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const statusTotal = statusEntries.reduce((s, [, n]) => s + n, 0) || 1;
  let acc = 0;
  const donutStops = statusEntries.map(([key, count], i) => {
    const start = (acc / statusTotal) * 360;
    acc += count;
    const end = (acc / statusTotal) * 360;
    return `${statusColors[i % statusColors.length]} ${start}deg ${end}deg`;
  });
  const donutBackground = donutStops.length
    ? `conic-gradient(${donutStops.join(", ")})`
    : "conic-gradient(#e5e7eb 0deg 360deg)";

  const dayKey = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const getDailyViews = (p: any): Record<string, number> => {
    const source = p.dailyViews || p.prices?.dailyViews;
    return source && typeof source === "object" && !Array.isArray(source) ? source : {};
  };

  const dailyVisits = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (13 - i));
    const key = dayKey(d);
    const count = siteStatsProduct
      ? Number(siteDailyViews[key] || 0)
      : realProducts.reduce((sum: number, p: any) => {
          const v = Number(getDailyViews(p)[key] || 0);
          return sum + (Number.isFinite(v) ? v : 0);
        }, 0);
    return {
      key,
      date: d,
      label: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", timeZone: "UTC" }),
      count,
    };
  });
  const maxDaily = Math.max(1, ...dailyVisits.map((d) => d.count));
  const todayVisits = dailyVisits[dailyVisits.length - 1]?.count || 0;
  const last7Visits = dailyVisits.slice(-7).reduce((s, d) => s + d.count, 0);
  const prev7Visits = dailyVisits.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const visitsTrend = prev7Visits > 0 ? ((last7Visits - prev7Visits) / prev7Visits) * 100 : last7Visits > 0 ? 100 : 0;

  const recent = realProducts.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-black/50">
            Welcome to FamiShop admin dashboard.
            {lastUpdated && (
              <span className="ml-2 text-black/40">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => load(false)}
          className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-black/10 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${s.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm text-black/50">{s.label}</p>
                <p className="text-2xl font-bold">
                  {s.prefix || ""}
                  {s.value.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-black/10 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Daily store visits</h2>
              <p className="text-xs text-black/40">Product page visits over the last 14 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold leading-none">{todayVisits}</p>
              <p className="text-[11px] text-black/40 mt-1">today</p>
            </div>
          </div>
          <div className="flex items-end gap-1 sm:gap-1.5 h-44">
            {dailyVisits.map((d, i) => (
              <div key={d.key} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group">
                <span className="text-[10px] font-semibold text-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </span>
                <div
                  className="w-full rounded-t-md bg-black/80 group-hover:bg-black transition-all duration-500"
                  style={{ height: `${Math.max(d.count > 0 ? 3 : 0, (d.count / maxDaily) * 100)}%` }}
                  title={`${d.label}: ${d.count} visit${d.count === 1 ? "" : "s"}`}
                />
                <span className="text-[9px] text-black/40 w-full text-center truncate">
                  {i % 2 === 0 ? d.date.getUTCDate() : ""}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs border-t border-black/5 pt-3">
            <div>
              <p className="text-black/40">Today</p>
              <p className="font-bold text-base">{todayVisits}</p>
            </div>
            <div>
              <p className="text-black/40">Last 7 days</p>
              <p className="font-bold text-base">{last7Visits}</p>
            </div>
            <div>
              <p className="text-black/40">vs previous 7 days</p>
              <p className={`font-bold text-base ${visitsTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {visitsTrend >= 0 ? "+" : ""}
                {visitsTrend.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-black/10 p-5">
          <h2 className="text-lg font-bold mb-4">Orders by status</h2>
          <div className="flex items-center gap-5">
            <div
              className="relative w-28 h-28 rounded-full shrink-0"
              style={{ background: donutBackground }}
            >
              <div className="absolute inset-[14px] rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{statusTotal === 1 && statusEntries.length === 0 ? 0 : orders.length}</span>
                <span className="text-[10px] text-black/40">orders</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {statusEntries.length === 0 && <p className="text-xs text-black/40">No orders yet.</p>}
              {statusEntries.map(([key, count], i) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 capitalize">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors[i % statusColors.length] }} />
                    {key}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-black/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={18} />
            <h2 className="text-lg font-bold">Most viewed products</h2>
          </div>
          {topViewed.length === 0 ? (
            <p className="text-sm text-black/40">No views tracked yet.</p>
          ) : (
            <div className="space-y-4">
              {topViewed.map((p) => (
                <div key={p.title} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md bg-[#F0EEED] overflow-hidden shrink-0">
                    <ProductImage
                      src={p.srcUrl || PRODUCT_IMAGE_FALLBACK}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                      alt={p.title}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between text-sm gap-3">
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="font-semibold tabular-nums shrink-0">{p.views}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-black transition-all duration-700"
                        style={{ width: `${Math.max(4, (p.views / maxViewed) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-black/10 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} />
            <h2 className="text-lg font-bold">Most viewed</h2>
          </div>
          {mostViewed ? (
            <>
              <p className="text-sm font-semibold line-clamp-2">{mostViewed.title}</p>
              <p className="text-3xl font-bold mt-2">
                {mostViewed.views != null ? Number(mostViewed.views) : Number(mostViewed.prices?.views || 0)}
              </p>
              <p className="text-xs text-black/40 mt-auto">total product page views</p>
            </>
          ) : (
            <p className="text-sm text-black/40">No data yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-black/10 p-5">
        <h2 className="text-lg font-bold mb-4">Recent Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-black/50">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Views</th>
              </tr>
            </thead>
            <tbody>
              {loading && recent.length === 0 ? (
                <tr>
                  <td className="py-2 pr-4 text-black/50" colSpan={4}>
                    Loading...
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td className="py-2 pr-4 text-black/50" colSpan={4}>
                    No products found.
                  </td>
                </tr>
              ) : (
                recent.map((p: any) => (
                  <tr key={p.id} className="border-b border-black/5">
                    <td className="py-2 pr-4">{p.id}</td>
                    <td className="py-2 pr-4">{p.title}</td>
                    <td className="py-2 pr-4">{p.price}</td>
                    <td className="py-2 pr-4">
                      {p.views != null ? Number(p.views) : p.prices?.views != null ? Number(p.prices.views) : 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
