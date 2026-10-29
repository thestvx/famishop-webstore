"use client";

import React, { useEffect, useState } from "react";
import { newArrivalsData, topSellingData, relatedProductData } from "@/lib/data/products";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";
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
  ];

  const recent = products.slice(0, 8);

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
              </tr>
            </thead>
            <tbody>
              {loading && recent.length === 0 ? (
                <tr>
                  <td className="py-2 pr-4 text-black/50" colSpan={3}>
                    Loading...
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td className="py-2 pr-4 text-black/50" colSpan={3}>
                    No products found.
                  </td>
                </tr>
              ) : (
                recent.map((p: any) => (
                  <tr key={p.id} className="border-b border-black/5">
                    <td className="py-2 pr-4">{p.id}</td>
                    <td className="py-2 pr-4">{p.title}</td>
                    <td className="py-2 pr-4">{p.price}</td>
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
