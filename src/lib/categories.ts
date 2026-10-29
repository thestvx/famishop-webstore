export type CategoryNode = {
  id: string;
  nameKey: string;
  name?: string;
  nameTranslations?: Record<string, string>;
  children?: CategoryNode[];
};

export type FlatCategory = {
  id: string;
  nameKey: string;
  name?: string;
  nameTranslations?: Record<string, string>;
  parentId: string | null;
  sortOrder: number;
};

export const CATEGORY_TREE: CategoryNode[] = [
  {
    id: "women",
    nameKey: "cat.women",
    children: [
      {
        id: "women-clothing",
        nameKey: "cat.clothing",
        children: [
          { id: "women-tshirts", nameKey: "cat.tshirts" },
          { id: "women-shirts", nameKey: "cat.shirts" },
          { id: "women-hoodies", nameKey: "cat.hoodies" },
          { id: "women-jeans", nameKey: "cat.jeans" },
          { id: "women-shorts", nameKey: "cat.shorts" },
          { id: "women-dresses", nameKey: "cat.dresses" },
          { id: "women-jackets", nameKey: "cat.jackets" },
        ],
      },
      { id: "women-shoes", nameKey: "cat.shoes" },
      { id: "women-bags", nameKey: "cat.bags" },
      {
        id: "women-accessories",
        nameKey: "cat.accessories",
        children: [
          { id: "women-hats", nameKey: "cat.hatsCaps" },
          { id: "women-belts", nameKey: "cat.belts" },
          { id: "women-jewelry", nameKey: "cat.jewelry" },
        ],
      },
      { id: "women-beauty", nameKey: "cat.beauty" },
    ],
  },
  {
    id: "men",
    nameKey: "cat.men",
    children: [
      {
        id: "men-clothing",
        nameKey: "cat.clothing",
        children: [
          { id: "men-tshirts", nameKey: "cat.tshirts" },
          { id: "men-shirts", nameKey: "cat.shirts" },
          { id: "men-hoodies", nameKey: "cat.hoodies" },
          { id: "men-jeans", nameKey: "cat.jeans" },
          { id: "men-shorts", nameKey: "cat.shorts" },
          { id: "men-jackets", nameKey: "cat.jackets" },
        ],
      },
      { id: "men-shoes", nameKey: "cat.shoes" },
      { id: "men-accessories", nameKey: "cat.accessories" },
    ],
  },
  {
    id: "kids",
    nameKey: "cat.kids",
    children: [
      { id: "kids-clothing", nameKey: "cat.clothing" },
      { id: "kids-shoes", nameKey: "cat.shoes" },
      { id: "kids-toys", nameKey: "cat.toys" },
    ],
  },
  { id: "home", nameKey: "cat.home", children: [{ id: "home-decor", nameKey: "cat.decor" }, { id: "home-kitchen", nameKey: "cat.kitchen" }] },
  { id: "electronics", nameKey: "cat.electronics", children: [{ id: "electronics-phones", nameKey: "cat.phones" }, { id: "electronics-computers", nameKey: "cat.computers" }] },
  { id: "books-media", nameKey: "cat.booksMedia", children: [{ id: "books", nameKey: "cat.books" }, { id: "movies", nameKey: "cat.movies" }] },
  { id: "leisure", nameKey: "cat.leisure", children: [{ id: "collectibles", nameKey: "cat.collectibles" }, { id: "games", nameKey: "cat.games" }] },
  { id: "sports", nameKey: "cat.sports", children: [{ id: "sports-clothing", nameKey: "cat.clothing" }, { id: "sports-equipment", nameKey: "cat.equipment" }, { id: "sports-shoes", nameKey: "cat.shoes" }] },
];

export function findCategoryPath(tree: CategoryNode[], id: string, path: CategoryNode[] = []): CategoryNode[] | null {
  for (const node of tree) {
    const next = [...path, node];
    if (node.id === id) return next;
    if (node.children) {
      const found = findCategoryPath(node.children, id, next);
      if (found) return found;
    }
  }
  return null;
}

export function searchCategories(tree: CategoryNode[], query: string, path: CategoryNode[] = []): { node: CategoryNode; path: CategoryNode[] }[] {
  const q = query.trim().toLowerCase();
  const results: { node: CategoryNode; path: CategoryNode[] }[] = [];
  for (const node of tree) {
    const next = [...path, node];
    const name = (node.nameKey || "").toLowerCase();
    if (!q || name.includes(q) || node.id.includes(q)) {
      results.push({ node, path: next });
    }
    if (node.children) {
      results.push(...searchCategories(node.children, query, next));
    }
  }
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.node.id)) return false;
    seen.add(r.node.id);
    return true;
  });
}

export function isLeaf(node: CategoryNode): boolean {
  return !node.children || node.children.length === 0;
}

export function getSizeType(categoryId: string | null): "clothing" | "shoes" | "hats" | "none" {
  if (!categoryId) return "none";
  const id = categoryId.toLowerCase();
  if (id.includes("shoes")) return "shoes";
  if (id.includes("hats")) return "hats";
  if (id.includes("clothing") || id.includes("tshirt") || id.includes("shirts") || id.includes("hoodies") || id.includes("jeans") || id.includes("shorts") || id.includes("dresses") || id.includes("jackets")) return "clothing";
  return "none";
}

export function getLocalizedCategoryName(
  node: CategoryNode,
  locale: string,
  t: (key: string) => string
): string {
  return (
    node.nameTranslations?.[locale] ||
    (node.nameKey ? t(node.nameKey) : "") ||
    node.nameTranslations?.en ||
    node.name ||
    node.id
  );
}

export function flattenCategoryTree(tree: CategoryNode[], parentId: string | null = null): FlatCategory[] {
  const out: FlatCategory[] = [];
  tree.forEach((node, index) => {
    out.push({
      id: node.id,
      nameKey: node.nameKey,
      name: node.name,
      nameTranslations: node.nameTranslations,
      parentId,
      sortOrder: index,
    });
    if (node.children?.length) {
      out.push(...flattenCategoryTree(node.children, node.id));
    }
  });
  return out;
}

export function buildCategoryTree(rows: FlatCategory[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const sorted = [...rows].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
  for (const row of sorted) {
    map.set(row.id, {
      id: row.id,
      nameKey: row.nameKey || "",
      name: row.name,
      nameTranslations: row.nameTranslations,
      children: [],
    });
  }
  const roots: CategoryNode[] = [];
  for (const row of sorted) {
    const node = map.get(row.id);
    if (!node) continue;
    if (row.parentId && map.has(row.parentId)) {
      map.get(row.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  Array.from(map.values()).forEach((node) => {
    if (node.children && node.children.length === 0) delete node.children;
  });
  return roots;
}

export function getCategoryDescendantIds(tree: CategoryNode[], id: string): Set<string> {
  const result = new Set<string>();
  const path = findCategoryPath(tree, id);
  if (!path) return result;
  const node = path[path.length - 1];
  const walk = (current: CategoryNode) => {
    result.add(current.id);
    current.children?.forEach(walk);
  };
  walk(node);
  return result;
}
