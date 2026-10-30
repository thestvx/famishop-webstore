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

function parseLegacyCustomer(value: any): AnyRecord {
  if (!value) return {};
  if (typeof value === "object") return value as AnyRecord;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") return parsed as AnyRecord;
      } catch {
        return { name: value };
      }
    }
    return { name: value };
  }
  return {};
}

function normalizeItems(raw: any): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    id: Number(item.id),
    name: toString(item.name),
    srcUrl: toString(item.srcUrl || item.src_url),
    price: toNumber(item.price),
    quantity: Math.max(1, Math.round(toNumber(item.quantity))),
    attributes: Array.isArray(item.attributes) ? item.attributes.map((v: any) => String(v)) : [],
    discount: item.discount || { amount: 0, percentage: 0 },
  }));
}

function normalizeOrder(row: AnyRecord): Order {
  const legacy = parseLegacyCustomer(row.customer);
  const shippingAddress =
    row.shipping_address ||
    row.shippingAddress ||
    legacy.shippingAddress || {
      address: legacy.address,
      city: legacy.city,
      postalCode: legacy.postalCode,
      country: legacy.country,
      region: legacy.region,
    };
  const items = normalizeItems(Array.isArray(row.items) ? row.items : legacy.items);
  const fallbackName =
    legacy.name ||
    `${toString(legacy.firstName)} ${toString(legacy.lastName)}`.trim();

  return {
    id: Number(row.id),
    createdAt: toString(row.created_at || row.createdAt),
    customerName: toString(row.customer_name || row.customerName || fallbackName),
    customerEmail: toString(row.customer_email || row.customerEmail || legacy.email),
    customerPhone: toString(row.customer_phone || row.customerPhone || legacy.phone),
    shippingAddress,
    shippingMethod: row.shipping_method || row.shippingMethod || legacy.shippingMethod || null,
    shippingFee: toNumber(row.shipping_fee ?? row.shippingFee ?? legacy.shippingFee),
    currency: toString(row.currency || legacy.currency) || "EUR",
    subtotal: toNumber(row.subtotal ?? legacy.subtotal),
    discount: toNumber(row.discount ?? legacy.discount),
    tax: toNumber(row.tax ?? legacy.tax),
    total: toNumber(row.total ?? legacy.total),
    status: toString(row.status || legacy.status) || "pending",
    paymentStatus: toString(row.payment_status || row.paymentStatus || legacy.paymentStatus) || "pending",
    paymentMethod:
      toString(row.payment_method || row.paymentMethod || legacy.paymentMethod) ||
      "cash_on_delivery",
    paymentReference:
      toString(row.payment_reference || row.paymentReference || legacy.paymentReference) || null,
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
