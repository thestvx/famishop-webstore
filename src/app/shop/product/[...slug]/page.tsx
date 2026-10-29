import ProductView from "./ProductView";
import { fetchProducts } from "@/lib/productsStore";

export async function generateStaticParams() {
  try {
    const products = await fetchProducts();
    return products.map((p) => ({
      slug: [String(p.id), p.title.split(" ").join("-")],
    }));
  } catch {
    return [];
  }
}

export default function ProductPage({ params }: { params: { slug: string[] } }) {
  return <ProductView slug={params.slug} />;
}