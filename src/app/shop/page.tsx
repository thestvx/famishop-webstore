"use client";

import React, { useEffect, useState } from "react";
import BreadcrumbShop from "@/components/shop-page/BreadcrumbShop";
import ProductCard from "@/components/common/ProductCard";
import { fetchProducts } from "@/lib/productsStore";
import { Product } from "@/types/product.types";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbShop />
        <div className="flex flex-col w-full space-y-5">
          <h1 className="font-bold text-2xl md:text-[32px]">Shop</h1>
          {loading ? (
            <div className="py-10 text-center text-black/50">Loading...</div>
          ) : products.length === 0 ? (
            <div className="py-10 text-center text-black/50">No products found.</div>
          ) : (
            <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} data={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}