"use client";

import React, { useState } from "react";
import { MdKeyboardArrowRight } from "react-icons/md";
import { IoChevronDown, IoChevronForward } from "react-icons/io5";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CategoryNode, getLocalizedCategoryName } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  tree: CategoryNode[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
};

const CategoriesSection = ({ tree, selectedCategory, onSelectCategory }: Props) => {
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: CategoryNode, depth: number): React.ReactNode => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isOpen = expanded.has(node.id);
    const isSelected = selectedCategory === node.id;
    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between py-2 text-black/60"
          style={{ paddingLeft: depth * 14 }}
        >
          <button
            type="button"
            onClick={() => onSelectCategory(node.id)}
            className={cn(
              "flex-1 text-left truncate hover:text-black transition-colors",
              isSelected && "text-black font-semibold"
            )}
          >
            {getLocalizedCategoryName(node, locale, t)}
          </button>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              aria-label={isOpen ? "Collapse" : "Expand"}
              className="p-1 text-black/50 hover:text-black"
            >
              {isOpen ? <IoChevronDown /> : <IoChevronForward />}
            </button>
          ) : (
            <MdKeyboardArrowRight className="text-black/30" />
          )}
        </div>
        {hasChildren && isOpen && (
          <div>{node.children!.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <Accordion type="single" collapsible defaultValue="filter-categories">
      <AccordionItem value="filter-categories" className="border-none">
        <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("shop.categories")}
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0">
          <div className="flex flex-col space-y-0.5">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={cn(
                "text-left py-2 text-black/60 hover:text-black transition-colors",
                selectedCategory === null && "text-black font-semibold"
              )}
            >
              {t("shop.allProducts")}
            </button>
            {tree.map((node) => renderNode(node, 0))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CategoriesSection;
