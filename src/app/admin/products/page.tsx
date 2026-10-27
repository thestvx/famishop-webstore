"use client";

import React from "react";
import { newArrivalsData, topSellingData, relatedProductData } from "@/lib/data/products";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";

const allProducts = [...newArrivalsData, ...topSellingData, ...relatedProductData];

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-black/50">Manage your store products.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/80"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>
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
              {allProducts.map((p) => (
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
