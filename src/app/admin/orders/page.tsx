"use client";

import React, { useEffect, useState } from "react";
import { fetchOrders } from "@/lib/ordersStore";
import { Order } from "@/types/order.types";
import { useI18n } from "@/lib/i18n";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MdDeleteOutline } from "react-icons/md";

export default function AdminOrdersPage() {
  const { t, formatPrice } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    fetchOrders()
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  };

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

  const handleDelete = async () => {
    if (!toDelete || !isSupabaseConfigured() || !supabase) return;
    setDeleting(true);
    setMessage(null);
    try {
      const { error } = await supabase.from("orders").delete().eq("id", toDelete.id);
      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.id !== toDelete.id));
      setMessage({ type: "success", text: t("admin.deleteSuccess") });
      setToDelete(null);
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || t("admin.deleteFailed") });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.orders")}</h1>
        <p className="text-sm text-black/50">{t("admin.ordersDesc")}</p>
      </div>

      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

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
                <button
                  type="button"
                  onClick={() => setToDelete(order)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
                  title={t("admin.deleteOrder")}
                >
                  <MdDeleteOutline className="text-lg" />
                  {t("admin.deleteOrder")}
                </button>
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

      {/* Confirmation modal */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold">{t("admin.confirmDeleteTitle")}</h2>
            <p className="text-sm text-black/60">{t("admin.confirmDeleteMessage")}</p>
            <p className="text-sm font-medium">
              {t("admin.orderNumber")}: <span className="font-bold">#{toDelete.id}</span>
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-full border border-black/10 text-sm font-medium disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {deleting ? t("common.loading") : t("admin.deleteOrder")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
