import ProductView from "./ProductView";
import { fetchProducts } from "@/lib/productsStore";

export function generateStaticParams() {
  return [{ slug: ["0", "placeholder"] }];
}

export default function ProductPage({ params }: { params: { slug: string[] } }) {
  return <ProductView slug={params.slug} />;
}