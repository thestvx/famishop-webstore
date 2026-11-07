"use client";

import React, { useEffect, useState } from "react";
import { newArrivalsData, topSellingData, relatedProductData } from "@/lib/data/products";
import { Package, ShoppingCart, Users, DollarSign, Eye, TrendingUp } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      if (!isSupabaseConfigured() || !supabase) {
        setProducts(fallbackProducts);
        setOrders([]);
        setCustomers([]);
        setLoading(false);
        return;
      }
      try {
        const [prodRes, orderRes, custRes] = await Promise.all([
          supabase.from("products").select("*").order("created_at", { ascending: false }),
          supabase.from("orders").select("*"),
          supabase.from("customers").select("*"),
        ]);
        if (!active) return;
        if (prodRes.data) setProducts(prodRes.data);
        if (orderRes.data) setOrders(orderRes.data);
        if (custRes.data) setCustomers(custRes.data);
      } catch (e) {
        // keep empty/partial
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const totalProducts = products.length;
  const totalOrders = orders.length;

  const totalViews = products.reduce((sum: number, p: any) => {
    const v = p.views != null ? Number(p.views) : p.prices?.views != null ? Number(p.prices.views) : 0;
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);
  const mostViewed = [...products].sort((a: any, b: any) => {
    const va = a.views != null ? Number(a.views) : a.prices?.views != null ? Number(a.prices.views) : 0;
    const vb = b.views != null ? Number(b.views) : b.prices?.views != null ? Number(b.prices.views) : 0;
    return vb - va;
  })[0];

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
    { label: "Store Visits", value: totalViews, icon: Eye, color: "bg-cyan-50 text-cyan-600", prefix: "" },
  ];

  const topViewed = [...products]
    .map((p: any) => ({
      title: p.title,
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

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d, label: d.toLocaleDateString(undefined, { weekday: "short" }), count: 0 };
  });
  orders.forEach((o: any) => {
    const raw = o.created_at || o.date;
    if (!raw) return;
    const d = new Date(raw);
    const idx = last7Days.findIndex(
      (day) => day.date.toDateString() === d.toDateString()
    );
    if (idx >= 0) last7Days[idx].count += 1;
  });
  const maxDay = Math.max(1, ...last7Days.map((d) => d.count));
  const chartW = 320;
  const chartH = 120;
  const chartPoints = last7Days
    .map((d, i) => {
      const x = (i / Math.max(1, last7Days.length - 1)) * chartW;
      const y = chartH - (d.count / maxDay) * (chartH - 20) - 10;
      return { x, y, ...d };
    })
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const linePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${chartH} ${linePoints} ${chartW},${chartH}`;

  const recent = products.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-black/50">Welcome to FamiShop admin dashboard.</p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Orders (last 7 days)</h2>
            <span className="text-xs text-black/40">total {orders.length}</span>
          </div>
          <div className="relative">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111111" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#111111" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1="0" y1={chartH * g} x2={chartW} y2={chartH * g} stroke="#00000010" strokeWidth="1" />
              ))}
              <polygon points={areaPoints} fill="url(#ordersFill)" />
              <polyline
                points={linePoints}
                fill="none"
                stroke="#111111"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {chartPoints.map((p) => (
                <circle key={p.label} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#111111" strokeWidth="2" />
              ))}
            </svg>
            <div className="flex justify-between mt-2 text-[11px] text-black/40">
              {last7Days.map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
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
            <h2 className="text-lg font-bold">Top viewed products</h2>
          </div>
          {topViewed.length === 0 ? (
            <p className="text-sm text-black/40">No views tracked yet.</p>
          ) : (
            <div className="space-y-3">
              {topViewed.map((p) => (
                <div key={p.title} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-3">{p.title}</span>
                    <span className="font-semibold tabular-nums">{p.views}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-black/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-black transition-all duration-700"
                      style={{ width: `${Math.max(4, (p.views / maxViewed) * 100)}%` }}
                    />
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
