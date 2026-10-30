"use client";

import { useI18n } from "@/lib/i18n";
import React from "react";

const CurrencySwitcher = () => {
  const { currency } = useI18n();
  return (
    <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-full border border-black/10 text-sm whitespace-nowrap">
      <span className="w-4 text-center">€</span>
      <span>{currency || "EUR"}</span>
    </div>
  );
};

export default CurrencySwitcher;
