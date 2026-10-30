export type OrderItem = {
  id: number;
  name: string;
  srcUrl: string;
  price: number;
  quantity: number;
  attributes: string[];
  discount?: { amount: number; percentage: number };
};

export type Order = {
  id: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Record<string, any>;
  shippingMethod: string | null;
  shippingFee: number;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference?: string | null;
  items: OrderItem[];
};
