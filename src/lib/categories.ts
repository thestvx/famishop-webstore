export type CategoryNode = {
  id: string;
  nameKey: string;
  children?: CategoryNode[];
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
    const name = node.nameKey.toLowerCase();
    if (!q || name.includes(q) || node.id.includes(q)) {
      // include leaves and parents? include all matches
      results.push({ node, path: next });
    }
    if (node.children) {
      results.push(...searchCategories(node.children, query, next));
    }
  }
  // dedupe by id
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