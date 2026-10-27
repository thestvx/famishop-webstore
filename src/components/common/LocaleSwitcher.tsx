"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

const locales = [
  { code: "en" as const, label: "English", flag: "🇬🇧" },
  { code: "fr" as const, label: "Français", flag: "🇫🇷" },
  { code: "ar" as const, label: "العربية", flag: "🇩🇿" },
  { code: "it" as const, label: "Italiano", flag: "🇮🇹" },
];

const LocaleSwitcher = () => {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const current = locales.find((l) => l.code === locale) || locales[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-full border border-black/10 hover:bg-black/5 transition-colors text-sm whitespace-nowrap"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden md:inline">{current.label}</span>
        <span className="md:hidden uppercase">{current.code}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white border border-black/10 rounded-lg shadow-lg overflow-hidden z-50">
            {locales.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5",
                  locale === l.code && "bg-black/5 font-medium"
                )}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LocaleSwitcher;
