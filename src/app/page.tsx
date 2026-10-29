"use client";

import React, { useEffect, useState } from "react";
import ProductListSec from "@/components/common/ProductListSec";
import Brands from "@/components/homepage/Brands";
import DressStyle from "@/components/homepage/DressStyle";
import Header from "@/components/homepage/Header";
import Reviews from "@/components/homepage/Reviews";
import { reviewsData } from "@/lib/data/products";
import { fetchProducts } from "@/lib/productsStore";
import { Product } from "@/types/product.types";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((loadedProducts) => {
        if (active) setProducts(loadedProducts);
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const newArrivals = products.slice(0, 4);
  const topSelling = [...products]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  return (
    <>
      <Header />
      <Brands />
      <main className="my-[50px] sm:my-[72px]">
        <ProductListSec
          title="section.newArrivals"
          data={newArrivals}
          viewAllLink="/shop#new-arrivals"
        />
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <hr className="h-[1px] border-t-black/10 my-10 sm:my-16" />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <ProductListSec
            title="section.topSelling"
            data={topSelling}
            viewAllLink="/shop#top-selling"
          />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <DressStyle />
        </div>
        <Reviews data={reviewsData} />
      </main>
    </>
  );
}
