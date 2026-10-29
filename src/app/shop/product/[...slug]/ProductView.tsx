"use client";

import React, { useEffect, useState } from "react";
import ProductListSec from "@/components/common/ProductListSec";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import { fetchProduct, fetchProducts, getLocalizedProductTitle } from "@/lib/productsStore";
import { Product } from "@/types/product.types";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function ProductView({ slug }: { slug?: string[] }) {
  const { locale, t } = useI18n();
  const [productData, setProductData] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const productId = slug?.[0];

  useEffect(() => {
    let cancelled = false;
    if (!productId) {
      setProductData(null);
      setRelated([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setProductData(null);

    fetchProduct(productId)
      .then((product) => {
        if (cancelled) return;
        setProductData(product);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("common.errorLoading"));
        setLoading(false);
      });

    fetchProducts()
      .then((all) => {
        if (cancelled) return;
        setRelated(all.filter((item) => String(item.id) !== String(productId)).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, retryKey, t]);

  if (loading) {
    return (
      <main>
        <div className="max-w-frame mx-auto px-4 xl:px-0 py-10 text-center text-black/50">
          {t("common.loading")}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="max-w-frame mx-auto px-4 xl:px-0 py-16 text-center">
          <h1 className="font-bold text-2xl mb-2">{t("product.errorTitle")}</h1>
          <p className="text-black/60 mb-6">{error}</p>
          <Button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="rounded-full bg-black text-white px-8"
          >
            {t("common.retry")}
          </Button>
        </div>
      </main>
    );
  }

  if (!productData) {
    return (
      <main>
        <div className="max-w-frame mx-auto px-4 xl:px-0 py-16 text-center">
          <h1 className="font-bold text-2xl mb-2">{t("product.notFound")}</h1>
          <p className="text-black/60 mb-6">{t("product.notFoundDesc")}</p>
          <Button asChild className="rounded-full bg-black text-white px-8">
            <a href="/shop">{t("product.backToShop")}</a>
          </Button>
        </div>
      </main>
    );
  }

  const localizedTitle = getLocalizedProductTitle(productData, locale) || t("product.untitled");

  return (
    <main>
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbProduct title={localizedTitle} />
        <section className="mb-11">
          <Header data={productData} />
        </section>
        <Tabs />
      </div>
      {related.length > 0 && (
        <div className="mb-[50px] sm:mb-20">
          <ProductListSec title="You might also like" data={related} />
        </div>
      )}
    </main>
  );
}
