import ProductView from "./ProductView";

export default function ProductPage({ params }: { params: { slug: string[] } }) {
  return <ProductView slug={params.slug} />;
}