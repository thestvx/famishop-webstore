"use client";

import React, { useEffect, useState } from "react";
import ProductListSec from "@/components/common/ProductListSec";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import { fetchProduct, fetchProducts } from "@/lib/productsStore";
import { Product } from "@/types/product.types";

export default function ProductView({ slug }: { slug: string[] }) {
  const [productData, setProductData] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = slug?.[0];
    if (!id) return;
    fetchProduct(id).then((p) => {
      setProductData(p);
      setLoading(false);
    });
    fetchProducts().then((all) => setRelated(all.slice(0, 4)));
  }, [slug]);

  if (loading) {
    return (
      <main>
        <div className="max-w-frame mx-auto px-4 xl:px-0 py-10 text-center text-black/50">
          Loading...
        </div>
      </main>
    );
  }

  if (!productData?.title) {
    return (
      <main>
        <div className="max-w-frame mx-auto px-4 xl:px-0 py-10 text-center text-black/50">
          Product not found.
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbProduct title={productData?.title ?? "product"} />
        <section className="mb-11">
          <Header data={productData} />
        </section>
        <Tabs />
      </div>
      <div className="mb-[50px] sm:mb-20">
        <ProductListSec title="You might also like" data={related} />
      </div>
    </main>
  );
}