"use client";

import { setSizeSelection } from "@/lib/features/products/productsSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

const SizeSelection = ({ sizes }: { sizes: string[] }) => {
  const { sizeSelection } = useAppSelector((state: RootState) => state.products);
  const dispatch = useAppDispatch();
  const { t } = useI18n();

  useEffect(() => {
    if (sizes.length > 0 && !sizes.includes(sizeSelection)) {
      dispatch(setSizeSelection(sizes[0]));
    }
  }, [sizes, sizeSelection, dispatch]);

  if (sizes.length === 0) return null;

  const labelFor = (size: string) => {
    if (size === "One Size") return t("product.oneSize");
    if (size.endsWith(" months")) return `${size.replace(" months", "")} ${t("product.months")}`;
    if (size.endsWith(" years")) return `${size.replace(" years", "")} ${t("product.years")}`;
    return size;
  };

  return (
    <div className="flex flex-col">
      <span className="text-sm sm:text-base text-black/60 mb-4">
        {t("product.chooseSize")}
      </span>
      <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={sizeSelection === size}
            className={cn(
              "bg-[#F0F0F0] flex items-center justify-center px-5 lg:px-6 py-2.5 lg:py-3 text-sm lg:text-base rounded-full min-h-[40px] transition-colors",
              sizeSelection === size && "bg-black font-medium text-white"
            )}
            onClick={() => dispatch(setSizeSelection(size))}
          >
            {labelFor(size)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelection;
