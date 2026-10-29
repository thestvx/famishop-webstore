"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MdKeyboardArrowRight } from "react-icons/md";
import { CategoryNode, getLocalizedCategoryName } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  tree: CategoryNode[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
};

const DressStyleSection = ({ tree, selectedCategory, onSelectCategory }: Props) => {
  const { t, locale } = useI18n();
  if (tree.length === 0) return null;

  return (
    <Accordion type="single" collapsible defaultValue="filter-style">
      <AccordionItem value="filter-style" className="border-none">
        <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("shop.dressStyle")}
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0">
          <div className="flex flex-col text-black/60 space-y-0.5">
            {tree.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectCategory(node.id)}
                className={cn(
                  "flex items-center justify-between py-2 text-left hover:text-black transition-colors",
                  selectedCategory === node.id && "text-black font-semibold"
                )}
              >
                {getLocalizedCategoryName(node, locale, t)}{" "}
                <MdKeyboardArrowRight />
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default DressStyleSection;
