import { CategoryNode } from "@/lib/categories";

export type ShopFiltersProps = {
  tree: CategoryNode[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  availableColors: string[];
  selectedColors: string[];
  onToggleColor: (color: string) => void;
  availableSizes: string[];
  selectedSizes: string[];
  onToggleSize: (size: string) => void;
  priceRange: [number, number];
  maxPrice: number;
  onPriceChange: (range: [number, number]) => void;
  onClearAll: () => void;
  activeFilterCount: number;
};
