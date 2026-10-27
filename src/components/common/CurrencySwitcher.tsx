"use client";

import { useI18n, type Currency } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

const currencies: Array<{ code: Currency; label: string; symbol: string }> = [
  { code: "USD", label: "USD - US Dollar", symbol: "$" },
  { code: "EUR", label: "EUR - Euro", symbol: "€" },
  { code: "DZD", label: "DZD - Algerian Dinar", symbol: "د.ج" },
];

const CurrencySwitcher = () => {
  const { currency, setCurrency } = useI18n();
  const [open, setOpen] = useState(false);
  const current = currencies.find((c) => c.code === currency) || currencies[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-full border border-black/10 hover:bg-black/5 transition-colors text-sm whitespace-nowrap"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="w-4 text-center">{current.symbol}</span>
        <span>{current.code}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white border border-black/10 rounded-lg shadow-lg overflow-hidden z-50">
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5",
                  currency === c.code && "bg-black/5 font-medium"
                )}
              >
                <span className="w-5 text-center">{c.symbol}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySwitcher;
