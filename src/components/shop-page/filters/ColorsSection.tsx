"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IoMdCheckmark } from "react-icons/io";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const COLOR_HEX: Record<string, string> = {
  Black: "#111111",
  White: "#ffffff",
  Grey: "#9ca3af",
  Gray: "#9ca3af",
  Beige: "#e8dcc8",
  Brown: "#8b5e3c",
  Red: "#dc2626",
  Pink: "#ec4899",
  Orange: "#ea580c",
  Yellow: "#facc15",
  Green: "#16a34a",
  Blue: "#2563eb",
  Navy: "#1e3a8a",
  Purple: "#9333ea",
  Gold: "#d4af37",
  Silver: "#c0c0c0",
  Multicolor: "#7c3aed",
};

type Props = {
  availableColors: string[];
  selectedColors: string[];
  onToggleColor: (color: string) => void;
};

const ColorsSection = ({ availableColors, selectedColors, onToggleColor }: Props) => {
  const { t } = useI18n();

  const labelFor = (color: string) => {
    const key = `color.${color}`;
    const translated = t(key);
    return translated === key ? color : translated;
  };

  return (
    <Accordion type="single" collapsible defaultValue="filter-colors">
      <AccordionItem value="filter-colors" className="border-none">
        <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("shop.colors")}
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0">
          {availableColors.length === 0 ? (
            <p className="text-sm text-black/40">{t("shop.noColors")}</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {availableColors.map((color) => {
                const selected = selectedColors.includes(color);
                const hex = COLOR_HEX[color] || "#d1d5db";
                const isLight = ["White", "Beige", "Yellow", "Silver"].includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    title={labelFor(color)}
                    aria-label={labelFor(color)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center border border-black/20 transition-transform",
                      selected && "ring-2 ring-offset-2 ring-black"
                    )}
                    style={{ backgroundColor: hex }}
                    onClick={() => onToggleColor(color)}
                  >
                    {selected && (
                      <IoMdCheckmark
                        className={cn("text-base", isLight ? "text-black" : "text-white")}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ColorsSection;
