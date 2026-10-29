import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Product } from "@/types/product.types";

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((p: any) => ({
    id: p.id,
    title: p.title_translations?.en || p.title || "",
    srcUrl: p.src_url || (Array.isArray(p.gallery) && p.gallery[0]) || "",
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    price: Number(p.price || 0),
    discount: p.discount || { amount: 0, percentage: 0 },
    rating: Number(p.rating || 0),
  }));
}

export async function fetchProduct(id: string | number): Promise<Product | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title_translations?.en || data.title || "",
    srcUrl: data.src_url || (Array.isArray(data.gallery) && data.gallery[0]) || "",
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    price: Number(data.price || 0),
    discount: data.discount || { amount: 0, percentage: 0 },
    rating: Number(data.rating || 0),
  };
}