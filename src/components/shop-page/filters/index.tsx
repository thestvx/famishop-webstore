"use client";

import React from "react";
import CategoriesSection from "@/components/shop-page/filters/CategoriesSection";
import ColorsSection from "@/components/shop-page/filters/ColorsSection";
import DressStyleSection from "@/components/shop-page/filters/DressStyleSection";
import PriceSection from "@/components/shop-page/filters/PriceSection";
import SizeSection from "@/components/shop-page/filters/SizeSection";
import { ShopFiltersProps } from "@/components/shop-page/filters/types";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const Filters = (props: ShopFiltersProps) => {
  const { t } = useI18n();
  const {
    tree,
    selectedCategory,
    onSelectCategory,
    availableColors,
    selectedColors,
    onToggleColor,
    availableSizes,
    selectedSizes,
    onToggleSize,
    priceRange,
    maxPrice,
    onPriceChange,
    onClearAll,
    activeFilterCount,
  } = props;

  return (
    <>
      <hr className="border-t-black/10" />
      <CategoriesSection
        tree={tree}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />
      <hr className="border-t-black/10" />
      <PriceSection
        priceRange={priceRange}
        maxPrice={maxPrice}
        onPriceChange={onPriceChange}
      />
      <hr className="border-t-black/10" />
      <ColorsSection
        availableColors={availableColors}
        selectedColors={selectedColors}
        onToggleColor={onToggleColor}
      />
      <hr className="border-t-black/10" />
      <SizeSection
        availableSizes={availableSizes}
        selectedSizes={selectedSizes}
        onToggleSize={onToggleSize}
      />
      <hr className="border-t-black/10" />
      <DressStyleSection
        tree={tree}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />
      {activeFilterCount > 0 && (
        <Button
          type="button"
          onClick={onClearAll}
          className="bg-black w-full rounded-full text-sm font-medium py-4 h-12"
        >
          {t("shop.clearAll")} ({activeFilterCount})
        </Button>
      )}
    </>
  );
};

export default Filters;
