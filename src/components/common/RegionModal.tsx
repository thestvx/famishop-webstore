"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";

type Region = "algeria" | "europe";

const RegionModal = () => {
  const { setRegion } = useI18n() as any;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Region>("europe");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("famishop-region");
    if (saved === "algeria" || saved === "europe") {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [setRegion]);

  const handleConfirm = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("famishop-region", selected);
    }
    if (typeof setRegion === "function") {
      setRegion(selected);
    }
    setOpen(false);
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-lg rounded-[24px] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Choisissez votre région</h2>
          <p className="text-black/70 text-sm sm:text-base">
            Sélectionnez votre région pour afficher les prix dans la devise appropriée.
          </p>
        </div>
        <div className="px-6 sm:px-10 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setSelected("algeria")}
            className={`w-full text-start rounded-[16px] border p-4 sm:p-5 transition-all ${
              selected === "algeria"
                ? "border-black ring-2 ring-black/5 bg-black/5"
                : "border-black/10 hover:border-black/30"
            }`}
          >
            <div className="font-semibold text-base sm:text-lg">Algérie</div>
            <div className="text-sm text-black/60 mt-1">Prix en dinars algériens (DZD)</div>
          </button>
          <button
            type="button"
            onClick={() => setSelected("europe")}
            className={`w-full text-start rounded-[16px] border p-4 sm:p-5 transition-all ${
              selected === "europe"
                ? "border-black ring-2 ring-black/5 bg-black/5"
                : "border-black/10 hover:border-black/30"
            }`}
          >
            <div className="font-semibold text-base sm:text-lg">Europe</div>
            <div className="text-sm text-black/60 mt-1">Prix en euros (EUR)</div>
          </button>
        </div>
        <div className="px-6 sm:px-10 py-6 sm:py-8 flex justify-center">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto px-10 py-3 rounded-full bg-black text-white hover:bg-black/90 transition-all font-medium"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RegionModal;