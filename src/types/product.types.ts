export type Discount = {
  amount: number;
  percentage: number;
};

export type PriceMap = {
  USD?: number | null;
  EUR?: number | null;
  DZD?: number | null;
};

export type Product = {
  id: number;
  title: string;
  srcUrl: string;
  gallery?: string[];
  price: number;
  discount: Discount;
  rating: number;
  titleTranslations?: Record<string, string>;
  description?: string | null;
  descriptionTranslations?: Record<string, string>;
  category?: string | null;
  categoryPath?: string | null;
  brand?: string | null;
  size?: string | null;
  condition?: string | null;
  colors?: string[];
  materials?: string[];
  packageSize?: string | null;
  weightGrams?: number | null;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  shippingCategory?: string | null;
  stock?: number | null;
  status?: string | null;
  prices?: PriceMap | null;
};
