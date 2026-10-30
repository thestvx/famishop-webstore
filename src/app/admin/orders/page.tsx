"use client";

import React, { useEffect, useState } from "react";
import { fetchOrders } from "@/lib/ordersStore";
import { Order } from "@/types/order.types";
import { useI18n } from "@/lib/i18n";

export default function AdminOrdersPage() {
  const { t, formatPrice } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.orders")}</h1>
        <p className="text-sm text-black/50">{t("admin.ordersDesc")}</p>
      </div>
      {loading ? (
        <div className="bg-white rounded-xl border border-black/10 p-10 text-center text-black/40">
          {t("common.loading")}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/10 p-10 text-center text-black/40">
          {t("admin.noOrders")}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-black/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="font-bold">#{order.id}</div>
                <div className="text-sm text-black/50">{order.createdAt}</div>
                <div className="text-sm">
                  <span className="px-2 py-1 rounded-full bg-black/5">{order.status}</span>
                  <span className="ml-2 px-2 py-1 rounded-full bg-black/5">{order.paymentStatus}</span>
                </div>
              </div>
              <div className="text-sm mb-2">
                <strong>{order.customerName}</strong> · {order.customerEmail} · {order.customerPhone}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-black/60 mb-3">
                <div>
                  {order.shippingAddress?.address}, {order.shippingAddress?.postalCode}{" "}
                  {order.shippingAddress?.city}, {order.shippingAddress?.country}
                </div>
                <div>
                  {t("admin.shippingMethod")}: {order.shippingMethod || "-"}
                </div>
                <div>
                  {t("admin.paymentMethod")}: {order.paymentMethod}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.name} ({item.attributes.filter(Boolean).join(", ")}) × {item.quantity}
                    </span>
                    <span>{item.price * item.quantity} {order.currency}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/60">{t("admin.subtotal")}</span>
                  <span>
                    {order.subtotal} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">{t("admin.shippingFee")}</span>
                  <span>
                    {order.shippingFee} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{t("cart.total")}</span>
                  <span>
                    {order.total} {order.currency}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
