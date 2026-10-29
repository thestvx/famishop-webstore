"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FiSliders } from "react-icons/fi";
import Filters from ".";
import { ShopFiltersProps } from "@/components/shop-page/filters/types";
import { useI18n } from "@/lib/i18n";

const MobileFilters = (props: ShopFiltersProps) => {
  const { t } = useI18n();

  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="h-8 w-8 rounded-full bg-[#F0F0F0] text-black p-1 md:hidden"
            aria-label={t("shop.filters")}
          >
            <FiSliders className="text-base mx-auto" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90%]">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <span className="font-bold text-black text-xl">{t("shop.filters")}</span>
              <FiSliders className="text-2xl text-black/40" />
            </div>
            <DrawerTitle className="hidden">{t("shop.filters")}</DrawerTitle>
            <DrawerDescription className="hidden">{t("shop.filters")}</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[90%] overflow-y-auto w-full px-5 md:px-6 py-5 space-y-5 md:space-y-6">
            <Filters {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MobileFilters;
