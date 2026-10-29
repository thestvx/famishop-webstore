"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  availableSizes: string[];
  selectedSizes: string[];
  onToggleSize: (size: string) => void;
};

const SizeSection = ({ availableSizes, selectedSizes, onToggleSize }: Props) => {
  const { t } = useI18n();

  return (
    <Accordion type="single" collapsible defaultValue="filter-size">
      <AccordionItem value="filter-size" className="border-none">
        <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("shop.size")}
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0">
          {availableSizes.length === 0 ? (
            <p className="text-sm text-black/40">{t("shop.noSizes")}</p>
          ) : (
            <div className="flex items-center flex-wrap">
              {availableSizes.map((size) => {
                const selected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "bg-[#F0F0F0] m-1 flex items-center justify-center px-5 py-2.5 text-sm rounded-full max-h-[39px] transition-colors",
                      selected && "bg-black font-medium text-white"
                    )}
                    onClick={() => onToggleSize(size)}
                  >
                    {size}
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

export default SizeSection;
