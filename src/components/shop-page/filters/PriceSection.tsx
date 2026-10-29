"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";

type Props = {
  priceRange: [number, number];
  maxPrice: number;
  onPriceChange: (range: [number, number]) => void;
};

const PriceSection = ({ priceRange, maxPrice, onPriceChange }: Props) => {
  const { t, formatPrice } = useI18n();
  const max = Math.max(1, Math.ceil(maxPrice));

  return (
    <Accordion type="single" collapsible defaultValue="filter-price">
      <AccordionItem value="filter-price" className="border-none">
        <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("shop.price")}
        </AccordionTrigger>
        <AccordionContent className="pt-4" contentClassName="overflow-visible">
          <div className="flex items-center justify-between text-sm font-medium mb-5">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
          <Slider
            min={0}
            max={max}
            step={1}
            value={priceRange}
            onValueChange={onPriceChange}
            showLabels={false}
          />
          <div className="mb-3" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default PriceSection;
