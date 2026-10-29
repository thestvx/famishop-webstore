"use client";

import { usePathname } from "next/navigation";
import ProductView from "@/app/shop/product/[...slug]/ProductView";

export default function ProductFallbackPage() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const productIndex = segments.indexOf("product");
  const slug = productIndex >= 0 ? segments.slice(productIndex + 1) : [];

  return <ProductView slug={slug} />;
}
