"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import ProductDetailsContent from "./ProductDetailsContent";
import ReviewsContent from "./ReviewsContent";
import FaqContent from "./FaqContent";
import { useI18n } from "@/lib/i18n";
import { Product } from "@/types/product.types";

const Tabs = ({ data }: { data: Product | null }) => {
  const { t } = useI18n();
  const [active, setActive] = useState<number>(1);

  const tabs = [
    { id: 1, label: t("product.tabDetails") },
    { id: 2, label: t("product.tabReviews") },
    { id: 3, label: t("product.tabFaq") },
  ];

  return (
    <div>
      <div className="flex items-center mb-6 sm:mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            type="button"
            className={cn([
              active === tab.id
                ? "border-black border-b-2 font-medium"
                : "border-b border-black/10 text-black/60 font-normal",
              "p-5 sm:p-6 rounded-none flex-1",
            ])}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="mb-12 sm:mb-16">
        {active === 1 && <ProductDetailsContent data={data} />}
        {active === 2 && <ReviewsContent />}
        {active === 3 && <FaqContent />}
      </div>
    </div>
  );
};

export default Tabs;
