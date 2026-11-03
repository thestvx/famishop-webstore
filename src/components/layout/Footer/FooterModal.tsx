"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

type FooterModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function FooterModal({ open, title, onClose, children }: FooterModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto text-sm md:text-base text-black/70 leading-relaxed space-y-4">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-black/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-black/80 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
