"use client";

import React from "react";
import { newArrivalsData, topSellingData, relatedProductData } from "@/lib/data/products";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

const allProducts = [
  ...newArrivalsData,
  ...topSellingData,
  ...relatedProductData,
];

const stats = [
  { label: "Total Products", value: allProducts.length, icon: Package, color: "bg-blue-50 text-blue-600" },
  { label: "Total Orders", value: 128, icon: ShoppingCart, color: "bg-green-50 text-green-600" },
  { label: "Customers", value: 64, icon: Users, color: "bg-purple-50 text-purple-600" },
  { label: "Revenue", value: 12480, icon: DollarSign, color: "bg-orange-50 text-orange-600", prefix: "$" },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-black/50">Welcome to FamiShop admin dashboard.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-black/10 p-5 flex items-center gap-4"
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
      <div className="bg-white rounded-xl border border-black/10 p-5">
        <h2 className="text-lg font-bold mb-4">Recent Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-black/50">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Rating</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.slice(0, 8).map((p) => (
                <tr key={p.id} className="border-b border-black/5">
                  <td className="py-2 pr-4">{p.id}</td>
                  <td className="py-2 pr-4">{p.title}</td>
                  <td className="py-2 pr-4">${p.price}</td>
                  <td className="py-2 pr-4">{p.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
