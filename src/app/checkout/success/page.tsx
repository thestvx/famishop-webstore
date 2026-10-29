"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

function SuccessContent() {
  const { t } = useI18n();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <span className="text-3xl">✓</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("checkout.successTitle")}</h1>
      <p className="text-black/60 mb-2">{t("checkout.successDesc")}</p>
      {orderId && (
        <p className="text-sm font-medium mb-6">
          {t("checkout.orderNumber")}: <span className="font-bold">#{orderId}</span>
        </p>
      )}
      <Link href="/shop" className="rounded-full bg-black text-white px-8 py-3 text-sm font-medium">
        {t("checkout.continueShopping")}
      </Link>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
