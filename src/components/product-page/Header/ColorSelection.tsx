"use client";

import { setColorSelection } from "@/lib/features/products/productsSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";
import { IoMdCheckmark } from "react-icons/io";

const COLOR_HEX: Record<string, string> = {
  Black: "#000000",
  White: "#FFFFFF",
  Grey: "#808080",
  Gray: "#808080",
  Beige: "#D2B48C",
  Brown: "#8B4513",
  Red: "#EF4444",
  Pink: "#EC4899",
  Orange: "#F97316",
  Yellow: "#EAB308",
  Green: "#22C55E",
  Blue: "#3B82F6",
  Navy: "#1E3A8A",
  Purple: "#A855F7",
  Gold: "#D4AF37",
  Silver: "#C0C0C0",
  Multicolor: "#7C3AED",
};

const LIGHT_COLORS = ["White", "Beige", "Yellow", "Silver"];

const ColorSelection = ({ colors }: { colors: string[] }) => {
  const { colorSelection } = useAppSelector((state: RootState) => state.products);
  const dispatch = useAppDispatch();
  const { t } = useI18n();

  useEffect(() => {
    if (colors.length > 0 && !colors.includes(colorSelection.name)) {
      const name = colors[0];
      dispatch(setColorSelection({ name, code: COLOR_HEX[name] || "#D1D5DB" }));
    }
  }, [colors, colorSelection.name, dispatch]);

  if (colors.length === 0) return null;

  const labelFor = (color: string) => {
    const key = `color.${color}`;
    const translated = t(key);
    return translated === key ? color : translated;
  };

  return (
    <div className="flex flex-col">
      <span className="text-sm sm:text-base text-black/60 mb-4">
        {t("product.selectColors")}
      </span>
      <div className="flex items-center flex-wrap gap-3 sm:gap-4">
        {colors.map((color) => {
          return (
            <div
              key={color}
              aria-label={labelFor(color)}
              title={labelFor(color)}
              className="rounded-full w-9 sm:w-10 h-9 sm:h-10 border border-black/10"
              style={{ backgroundColor: COLOR_HEX[color] || "#D1D5DB" }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorSelection;
