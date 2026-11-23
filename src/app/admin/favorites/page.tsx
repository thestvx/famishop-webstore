"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isAnalyticsProduct } from "@/lib/productsStore";

type FavRow = {
  productId: string;
  count: number;
  uids: string[];
  addedDates: number[];
};

export default function AdminFavoritesPage() {
  const [rows, setRows] = useState<FavRow[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("most");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!isSupabaseConfigured() || !supabase) throw new Error("Supabase not configured");
        const snap = await getDocs(collectionGroup(firestore, "wishlist"));
        const map = new Map<string, { uids: Set<string>; dates: number[] }>();
        snap.docs.forEach((d) => {
          const productId = String(d.id);
          const uid = d.ref.parent.parent?.id || "";
          if (!uid) return;
          if (!map.has(productId)) map.set(productId, { uids: new Set(), dates: [] });
          const entry = map.get(productId)!;
          entry.uids.add(uid);
          const data: any = d.data();
          const ts = data?.addedAt?.seconds ? data.addedAt.seconds * 1000 : data?.addedAt ? new Date(data.addedAt).getTime() : null;
          if (ts && Number.isFinite(ts)) entry.dates.push(ts);
        });
        const { data: prods, error: pErr } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        if (pErr) throw pErr;
        if (!active) return;
        const favRows: FavRow[] = Array.from(map.entries()).map(([productId, entry]) => ({
          productId,
          count: entry.uids.size,
          uids: Array.from(entry.uids),
          addedDates: entry.dates,
        }));
        setRows(favRows);
        setProducts((prods || []).filter((p: any) => !isAnalyticsProduct(p)));
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load favorites.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const productMap = useMemo(() => new Map(products.map((p: any) => [String(p.id), p])), [products]);

  const merged = useMemo(() => {
    return rows
      .map((row) => {
        const p = productMap.get(row.productId);
        return { ...row, product: p || null };
      })
      .filter((row) => row.product);
  }, [rows, productMap]);

  const filtered = useMemo(() => {
    let result = merged;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) => {
        const p = row.product;
        return String(p?.title || "").toLowerCase().includes(q) || String(p?.brand || "").toLowerCase().includes(q);
      });
    }
    if (sort === "most") result = [...result].sort((a, b) => b.count - a.count);
    else if (sort === "least") result = [...result].sort((a, b) => a.count - b.count);
    else if (sort === "name") result = [...result].sort((a, b) => String(a.product?.title || "").localeCompare(String(b.product?.title || "")));
    return result;
  }, [merged, search, sort]);

  const totalFavorites = rows.reduce((s, r) => s + r.count, 0);
  const uniqueCustomers = new Set(rows.flatMap((r) => r.uids)).size;
  const productsWithFavorites = merged.length;
  const mostFavorited = merged.length ? merged.reduce((a, b) => (a.count > b.count ? a : b)) : null;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const addedToday = rows.reduce((s, r) => s + r.addedDates.filter((d) => now - d < day).length, 0);
  const addedWeek = rows.reduce((s, r) => s + r.addedDates.filter((d) => now - d < 7 * day).length, 0);
  const addedMonth = rows.reduce((s, r) => s + r.addedDates.filter((d) => now - d < 30 * day).length, 0);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Produits favoris</h1>
        <p className="text-sm text-black/50">Favorite Products</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-black/60">Total favorite actions</div><div className="text-2xl font-bold">{totalFavorites}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-black/60">Unique customers</div><div className="text-2xl font-bold">{uniqueCustomers}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-black/60">Products with favorites</div><div className="text-2xl font-bold">{productsWithFavorites}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-black/60">Most favorited</div><div className="text-lg font-bold">{mostFavorited?.product?.title || "-"}</div><div className="text-sm text-black/60">{mostFavorited ? `${mostFavorited.count} customers` : ""}</div></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-black/60">Added today</div><div className="text-xl font-bold">{addedToday}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-black/60">Added this week</div><div className="text-xl font-bold">{addedWeek}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-black/60">Added this month</div><div className="text-xl font-bold">{addedMonth}</div></div>
      </div>
      <div className="bg-white rounded-xl border p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="px-3 py-2 rounded-lg border border-black/10 text-sm w-full md:w-64" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm">
          <option value="most">Most favorited</option>
          <option value="least">Least favorited</option>
          <option value="name">Alphabetical</option>
        </select>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] text-black/50">
            <tr>
              <th className="py-3 px-4 text-left">Product</th>
              <th className="py-3 px-4 text-left">Brand</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-left">Price</th>
              <th className="py-3 px-4 text-left">Favorites</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-6 px-4 text-black/50">No favorite products yet.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.productId} className="border-t border-black/5">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {row.product?.src_url ? <img src={row.product.src_url} alt={row.product.title} className="w-10 h-10 rounded object-contain bg-[#F0EEED]" /> : null}
                    <span>{row.product?.title}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{row.product?.brand || "-"}</td>
                <td className="py-3 px-4">{row.product?.category || "-"}</td>
                <td className="py-3 px-4">{row.product?.price}</td>
                <td className="py-3 px-4 font-bold">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
