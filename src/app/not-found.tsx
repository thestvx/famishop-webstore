"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ProductView from "@/app/shop/product/[...slug]/ProductView";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const productIndex = segments.indexOf("product");

  if (productIndex >= 0 && segments[0] === "shop") {
    const slug = segments.slice(productIndex + 1);
    return <ProductView slug={slug} />;
  }

  const { t } = useI18n();
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold mb-3">404</h1>
      <p className="text-black/60 mb-6">{t("common.notFound")}</p>
      <Link href="/" className="rounded-full bg-black text-white px-8 py-3">
        {t("common.home")}
      </Link>
    </main>
  );
}
