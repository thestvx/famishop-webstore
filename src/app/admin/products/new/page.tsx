"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-black/10 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => router.push("/admin/products")}
            className="flex items-center gap-1 text-sm"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex-1 text-center text-base font-semibold">Add Product</div>
          <div className="w-14" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        <div className="bg-white rounded-xl border border-black/10 p-4">
          <p className="text-sm text-black/60">Building new product flow...</p>
        </div>
      </main>
    </div>
  );
}
