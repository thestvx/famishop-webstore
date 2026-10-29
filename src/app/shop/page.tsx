"use client";

import React, { useEffect, useMemo, useState } from "react";
import BreadcrumbShop from "@/components/shop-page/BreadcrumbShop";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileFilters from "@/components/shop-page/filters/MobileFilters";
import Filters from "@/components/shop-page/filters";
import { FiSliders } from "react-icons/fi";
import ProductCard from "@/components/common/ProductCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchProducts } from "@/lib/productsStore";
import { CATEGORY_TREE, CategoryNode, findCategoryPath, getCategoryDescendantIds, getLocalizedCategoryName } from "@/lib/categories";
import { fetchCategoryTree } from "@/lib/categoriesStore";
import { useI18n } from "@/lib/i18n";
import { Product } from "@/types/product.types";

const PAGE_SIZE = 9;

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function matchesCategory(product: Product, categoryId: string, tree: CategoryNode[]): boolean {
  const ids = getCategoryDescendantIds(tree, categoryId);
  if (product.category && ids.has(product.category)) return true;

  const path = findCategoryPath(tree, categoryId);
  const node = path?.[path.length - 1];
  if (!node) return false;

  const names = new Set<string>();
  if (node.id) names.add(node.id.toLowerCase());
  if (node.name) names.add(node.name.toLowerCase());
  if (node.nameTranslations) {
    Object.values(node.nameTranslations).forEach((name) => {
      if (name) names.add(name.toLowerCase());
    });
  }

  const productCategory = (product.category || "").toLowerCase().trim();
  if (productCategory && names.has(productCategory)) return true;

  const productPath = (product.categoryPath || "").toLowerCase();
  if (productPath) {
    for (const name of Array.from(names)) {
      if (name && productPath.includes(name)) return true;
    }
  }

  return false;
}

export default function ShopPage() {
  const { t, locale } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [tree, setTree] = useState<CategoryNode[]>(CATEGORY_TREE);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceTouched, setPriceTouched] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [sort, setSort] = useState("most-popular");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    Promise.all([fetchProducts(), fetchCategoryTree()])
      .then(([loadedProducts, loadedTree]) => {
        if (!active) return;
        setProducts(loadedProducts);
        setTree(loadedTree.length ? loadedTree : CATEGORY_TREE);
        const highest = loadedProducts.reduce((max, product) => Math.max(max, product.price), 0);
        setMaxPrice(highest);
        setPriceRange((current) => (priceTouched ? current : [0, Math.ceil(highest)]));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableColors = useMemo(
    () => uniqueSorted(products.flatMap((product) => product.colors || [])),
    [products]
  );

  const availableSizes = useMemo(
    () =>
      uniqueSorted(
        products.flatMap((product) =>
          (product.size || "")
            .split(/[,/|]/)
            .map((size) => size.trim())
            .filter(Boolean)
        )
      ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      if (selectedCategory && !matchesCategory(product, selectedCategory, tree)) return false;

      if (selectedColors.length > 0) {
        const productColors = (product.colors || []).map((color) => color.toLowerCase());
        const hasColor = selectedColors.some((color) => productColors.includes(color.toLowerCase()));
        if (!hasColor) return false;
      }

      if (selectedSizes.length > 0) {
        const productSizes = (product.size || "")
          .split(/[,/|]/)
          .map((size) => size.trim().toLowerCase())
          .filter(Boolean);
        const hasSize = selectedSizes.some((size) => productSizes.includes(size.toLowerCase()));
        if (!hasSize) return false;
      }

      if (priceRange[0] > 0 && product.price < priceRange[0]) return false;
      if (priceRange[1] > 0 && product.price > priceRange[1]) return false;

      return true;
    });

    if (sort === "low-price") result.sort((a, b) => a.price - b.price);
    else if (sort === "high-price") result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return result;
  }, [products, selectedCategory, tree, selectedColors, selectedSizes, priceRange, sort]);

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    (priceTouched ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedColors, selectedSizes, priceRange, sort]);

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((item) => item !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]
    );
  };

  const handlePriceChange = (range: [number, number]) => {
    setPriceTouched(true);
    setPriceRange(range);
  };

  const clearAll = () => {
    setSelectedCategory(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceTouched(false);
    setPriceRange([0, Math.ceil(maxPrice)]);
  };

  const filterProps = {
    tree,
    selectedCategory,
    onSelectCategory: setSelectedCategory,
    availableColors,
    selectedColors,
    onToggleColor: toggleColor,
    availableSizes,
    selectedSizes,
    onToggleSize: toggleSize,
    priceRange,
    maxPrice,
    onPriceChange: handlePriceChange,
    onClearAll: clearAll,
    activeFilterCount,
  };

  const selectedPath = selectedCategory ? findCategoryPath(tree, selectedCategory) : null;
  const selectedNode = selectedPath?.[selectedPath.length - 1];
  const pageTitle = selectedNode ? getLocalizedCategoryName(selectedNode, locale, t) : t("nav.shop");

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbShop />
        <div className="flex md:gap-5 items-start">
          <div className="hidden md:block min-w-[295px] max-w-[295px] border border-black/10 rounded-[20px] px-5 md:px-6 py-5 space-y-5 md:space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-black text-xl">{t("shop.filters")}</span>
              <FiSliders className="text-2xl text-black/40" />
            </div>
            <Filters {...filterProps} />
          </div>
          <div className="flex flex-col w-full space-y-5">
            <div className="flex flex-col lg:flex-row lg:justify-between">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl md:text-[32px]">{pageTitle}</h1>
                <MobileFilters {...filterProps} />
              </div>
              <div className="flex flex-col sm:items-center sm:flex-row">
                <span className="text-sm md:text-base text-black/60 mr-3">
                  {t("shop.showing")} {filteredProducts.length} {t("shop.products")}
                </span>
                <div className="flex items-center">
                  {t("shop.sortBy")}{" "}
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="font-medium text-sm px-1.5 sm:text-base w-fit text-black bg-transparent shadow-none border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="most-popular">{t("shop.mostPopular")}</SelectItem>
                      <SelectItem value="low-price">{t("shop.lowPrice")}</SelectItem>
                      <SelectItem value="high-price">{t("shop.highPrice")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="py-10 text-center text-black/50">{t("common.loading")}</div>
            ) : pageProducts.length === 0 ? (
              <div className="py-10 text-center text-black/50">{t("shop.noProducts")}</div>
            ) : (
              <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {pageProducts.map((product) => (
                  <ProductCard key={product.id} data={product} />
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <Pagination className="mt-5">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((current) => Math.max(1, current - 1));
                      }}
                      className={safePage <= 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === safePage}
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((current) => Math.min(totalPages, current + 1));
                      }}
                      className={safePage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            <hr className="border-t-black/10" />
          </div>
        </div>
      </div>
    </main>
  );
}
