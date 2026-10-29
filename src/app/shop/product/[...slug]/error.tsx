"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <main>
      <div className="max-w-frame mx-auto px-4 xl:px-0 py-16 text-center">
        <h1 className="font-bold text-2xl mb-2">{t("product.errorTitle")}</h1>
        <p className="text-black/60 mb-6">{error?.message || t("common.errorLoading")}</p>
        <Button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-black text-white px-8"
        >
          {t("common.retry")}
        </Button>
      </div>
    </main>
  );
}
