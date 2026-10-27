"use client";

import React, { useEffect, useState } from "react";
import { newArrivalsData, topSellingData, relatedProductData } from "@/lib/data/products";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Product } from "@/types/product.types";

const fallbackProducts = [...newArrivalsData, ...topSellingData, ...relatedProductData];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    supabase
      .from("products")
      .select("*")
      .then(({ data, error }: { data: any; error: any }) => {
        if (!active) return;
        if (!error && data && data.length > 0) {
          setProducts(
            data.map((row: any) => ({
              id: row.id,
              title: row.title,
              srcUrl: row.src_url,
              price: Number(row.price),
              rating: Number(row.rating ?? 0),
              discount: row.discount ?? { amount: 0, percentage: 0 },
              gallery: row.gallery ?? [row.src_url],
            }))
          );
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-black/50">
            {isSupabaseConfigured()
              ? "Synced with Supabase."
              : "Using local data. Configure Supabase env to sync."}
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/80"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>
      {loading && <p className="text-sm text-black/50">Loading...</p>}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-black/50 bg-[#F5F5F5]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-black/5 hover:bg-[#FAFAFA]">
                  <td className="py-3 px-4">{p.id}</td>
                  <td className="py-3 px-4">{p.title}</td>
                  <td className="py-3 px-4">${p.price}</td>
                  <td className="py-3 px-4">{p.rating}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded hover:bg-gray-100" aria-label="edit">
                        <Pencil size={16} />
                      </button>
                      <button className="p-1.5 rounded hover:bg-gray-100 text-red-500" aria-label="delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
