import ProductView from "./ProductView";

export function generateStaticParams() {
  return [{ slug: ["0", "placeholder"] }];
}

export default function ProductPage({ params }: { params: { slug: string[] } }) {
  return <ProductView slug={params.slug} />;
}