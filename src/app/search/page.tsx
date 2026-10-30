"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/common/ProductCard";
import BreadcrumbShop from "@/components/shop-page/BreadcrumbShop";
import { fetchProducts } from "@/lib/productsStore";
import { useI18n } from "@/lib/i18n";
import { Product } from "@/types/product.types";

function readQuery(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") || "";
}

function matchesQuery(product: Product, query: string): boolean {
  if (!query) return true;
  const haystack = [
    product.title,
    product.brand,
    product.category,
    product.categoryPath,
    product.description,
    ...Object.values(product.titleTranslations || {}),
    ...Object.values(product.descriptionTranslations || {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export default function SearchPage() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQuery(readQuery());
    let active = true;
    fetchProducts()
      .then((loaded) => {
        if (active) setProducts(loaded);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(
    () => products.filter((product) => matchesQuery(product, query.trim())),
    [products, query]
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    const url = next ? `/search/?q=${encodeURIComponent(next)}` : "/search/";
    window.history.replaceState(null, "", url);
  };

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbShop />
        <form onSubmit={submit} className="mb-6 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("common.searchPlaceholder")}
            className="w-full rounded-full border border-black/10 bg-[#F0F0F0] px-5 py-3 text-base outline-none focus:border-black/30"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
          >
            {t("nav.shop")}
          </button>
        </form>
        {loading ? (
          <div className="py-10 text-center text-black/50">{t("common.loading")}</div>
        ) : results.length === 0 ? (
          <div className="py-10 text-center text-black/50">{t("shop.noProducts")}</div>
        ) : (
          <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {results.map((product) => (
              <ProductCard key={`${product.id}-${locale}`} data={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
