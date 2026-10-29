import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  CATEGORY_TREE,
  CategoryNode,
  FlatCategory,
  buildCategoryTree,
  flattenCategoryTree,
  getCategoryDescendantIds,
} from "@/lib/categories";

const TABLE = "categories";

function toStringRecord(value: any): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "string" && val.trim()) out[key] = val.trim();
  }
  return out;
}

function normalizeRow(row: any): FlatCategory {
  return {
    id: String(row.id),
    nameKey: typeof row.name_key === "string" ? row.name_key : "",
    name: typeof row.name === "string" ? row.name : undefined,
    nameTranslations: toStringRecord(row.name_translations),
    parentId: row.parent_id ? String(row.parent_id) : null,
    sortOrder: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
  };
}

export async function fetchCategoryRows(): Promise<{ rows: FlatCategory[] | null; error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { rows: null, error: "Supabase is not configured" };
  }
  const { data, error } = await supabase.from(TABLE).select("*").order("sort_order", { ascending: true });
  if (error) return { rows: null, error: error.message };
  return { rows: (data || []).map(normalizeRow), error: null };
}

export async function fetchCategoryTree(): Promise<CategoryNode[]> {
  const { rows } = await fetchCategoryRows();
  if (!rows || rows.length === 0) return CATEGORY_TREE;
  const tree = buildCategoryTree(rows);
  return tree.length > 0 ? tree : CATEGORY_TREE;
}

function seedRows() {
  return flattenCategoryTree(CATEGORY_TREE).map((row) => ({
    id: row.id,
    name_key: row.nameKey,
    name_translations: row.nameTranslations || {},
    parent_id: row.parentId,
    sort_order: row.sortOrder,
  }));
}

export async function loadCategoriesForAdmin(): Promise<{
  tree: CategoryNode[];
  ready: boolean;
  error: string | null;
}> {
  const { rows, error } = await fetchCategoryRows();
  if (error) {
    return { tree: CATEGORY_TREE, ready: false, error };
  }
  if (!rows || rows.length === 0) {
    if (!supabase) return { tree: CATEGORY_TREE, ready: false, error: "Supabase is not configured" };
    const { error: seedError } = await supabase.from(TABLE).insert(seedRows());
    if (seedError) {
      return { tree: CATEGORY_TREE, ready: false, error: seedError.message };
    }
    return { tree: CATEGORY_TREE, ready: true, error: null };
  }
  const tree = buildCategoryTree(rows);
  return { tree: tree.length > 0 ? tree : CATEGORY_TREE, ready: true, error: null };
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "category";
}

export async function createCategory(input: {
  nameTranslations: Record<string, string>;
  parentId?: string | null;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const parentId = input.parentId || null;
  const { rows } = await fetchCategoryRows();
  const siblings = (rows || []).filter((row) => row.parentId === parentId);
  const sortOrder = siblings.length > 0 ? Math.max(...siblings.map((row) => row.sortOrder)) + 1 : 0;
  const englishName = input.nameTranslations.en || input.nameTranslations.fr || input.nameTranslations.ar || "category";
  const id = `${slugify(englishName)}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase.from(TABLE).insert([
    {
      id,
      name_key: null,
      name_translations: input.nameTranslations,
      parent_id: parentId,
      sort_order: sortOrder,
    },
  ]);
  if (error) throw error;
  return id;
}

export async function updateCategory(
  id: string,
  input: { nameTranslations?: Record<string, string>; parentId?: string | null }
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const payload: Record<string, any> = {};
  if (input.nameTranslations) payload.name_translations = input.nameTranslations;
  if (input.parentId !== undefined) payload.parent_id = input.parentId || null;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from(TABLE).update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const tree = await fetchCategoryTree();
  const ids = Array.from(getCategoryDescendantIds(tree, id));
  const { error } = await supabase.from(TABLE).delete().in("id", ids.length > 0 ? ids : [id]);
  if (error) throw error;
}
