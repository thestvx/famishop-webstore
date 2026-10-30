import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Product } from "@/types/product.types";

type AnyRecord = Record<string, any>;

function toStringRecord(value: any): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "string" && val.trim()) out[key] = val;
  }
  return out;
}

function toStringArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

function normalizeDiscount(value: any) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const amount = Number(source.amount);
  const percentage = Number(source.percentage);
  return {
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    percentage: Number.isFinite(percentage) && percentage > 0 ? Math.min(percentage, 100) : 0,
  };
}

function normalizeRating(value: any): number {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.min(Math.max(rating, 0), 5);
}

function normalizePrice(value: any): number {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function normalizeProduct(row: AnyRecord): Product | null {
  const rawId = row?.id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isFinite(id)) return null;

  const titleTranslations = toStringRecord(row.title_translations);
  const descriptionTranslations = toStringRecord(row.description_translations);
  const fallbackTitle = typeof row.title === "string" ? row.title.trim() : "";
  const title =
    titleTranslations.en ||
    fallbackTitle ||
    Object.values(titleTranslations)[0] ||
    "";

  const srcUrl = typeof row.src_url === "string" && row.src_url.trim() ? row.src_url.trim() : "";
  const gallery = unique([srcUrl, ...toStringArray(row.gallery)].filter(Boolean));

  const prices =
    row.prices && typeof row.prices === "object" && !Array.isArray(row.prices)
      ? {
          USD: row.prices.USD != null ? Number(row.prices.USD) : null,
          EUR: row.prices.EUR != null ? Number(row.prices.EUR) : null,
          DZD: row.prices.DZD != null ? Number(row.prices.DZD) : null,
        }
      : null;

  return {
    id,
    title,
    srcUrl: srcUrl || gallery[0] || "",
    gallery,
    price: normalizePrice(row.price),
    discount: normalizeDiscount(row.discount),
    rating: normalizeRating(row.rating),
    titleTranslations,
    description:
      typeof row.description === "string" && row.description.trim()
        ? row.description
        : Object.values(descriptionTranslations)[0] || null,
    descriptionTranslations,
    category: typeof row.category === "string" && row.category.trim() ? row.category : null,
    categoryPath: typeof row.category_path === "string" && row.category_path.trim() ? row.category_path : null,
    brand: typeof row.brand === "string" && row.brand.trim() ? row.brand : null,
    size: typeof row.size === "string" && row.size.trim() ? row.size : null,
    condition: typeof row.condition === "string" && row.condition.trim() ? row.condition : null,
    colors: toStringArray(row.colors),
    materials: toStringArray(row.materials),
    packageSize: typeof row.package_size === "string" && row.package_size.trim() ? row.package_size : null,
    weightGrams: row.weight_grams != null ? Number(row.weight_grams) : null,
    lengthCm: row.length_cm != null ? Number(row.length_cm) : null,
    widthCm: row.width_cm != null ? Number(row.width_cm) : null,
    heightCm: row.height_cm != null ? Number(row.height_cm) : null,
    shippingCategory: typeof row.shipping_category === "string" ? row.shipping_category : null,
    stock: row.stock != null ? Number(row.stock) : null,
    status: typeof row.status === "string" ? row.status : null,
    prices,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !Array.isArray(data)) return [];
  return data
    .map((row: AnyRecord) => normalizeProduct(row))
    .filter((product): product is Product => product !== null);
}

export async function fetchProduct(id: string | number): Promise<Product | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const rawId = String(id ?? "").trim();
  if (!rawId) return null;
  const numericId = Number(rawId);
  const queryId = Number.isFinite(numericId) && String(numericId) === rawId ? numericId : rawId;
  const { data, error } = await supabase.from("products").select("*").eq("id", queryId).maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to load product");
  }
  if (!data) return null;
  return normalizeProduct(data);
}

export function getLocalizedProductTitle(product: Product, locale: string): string {
  const translations = product.titleTranslations || {};
  return translations[locale] || translations.en || product.title || "";
}

export function getLocalizedProductDescription(product: Product, locale: string): string {
  const translations = product.descriptionTranslations || {};
  return translations[locale] || translations.en || product.description || "";
}
