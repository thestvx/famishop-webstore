import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Order, OrderItem } from "@/types/order.types";

type AnyRecord = Record<string, any>;

function toString(value: any): string {
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeOrder(row: AnyRecord): Order {
  const items: OrderItem[] = Array.isArray(row.items)
    ? row.items.map((item: any) => ({
        id: Number(item.id),
        name: toString(item.name),
        srcUrl: toString(item.srcUrl || item.src_url),
        price: toNumber(item.price),
        quantity: Math.max(1, Math.round(toNumber(item.quantity))),
        attributes: Array.isArray(item.attributes) ? item.attributes.map((v: any) => String(v)) : [],
        discount: item.discount || { amount: 0, percentage: 0 },
      }))
    : [];

  return {
    id: Number(row.id),
    createdAt: toString(row.created_at || row.createdAt),
    customerName: toString(row.customer_name || row.customerName || row.customer),
    customerEmail: toString(row.customer_email || row.customerEmail),
    customerPhone: toString(row.customer_phone || row.customerPhone),
    shippingAddress: row.shipping_address || row.shippingAddress || {},
    shippingMethod: row.shipping_method || row.shippingMethod || null,
    shippingFee: toNumber(row.shipping_fee ?? row.shippingFee),
    currency: toString(row.currency) || "EUR",
    subtotal: toNumber(row.subtotal),
    discount: toNumber(row.discount),
    tax: toNumber(row.tax),
    total: toNumber(row.total),
    status: toString(row.status) || "pending",
    paymentStatus: toString(row.payment_status || row.paymentStatus) || "pending",
    paymentMethod: toString(row.payment_method || row.paymentMethod) || "cash_on_delivery",
    items,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !Array.isArray(data)) return [];
  return data.map(normalizeOrder);
}
