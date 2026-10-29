"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { CategoryNode, findCategoryPath, getCategoryDescendantIds, getLocalizedCategoryName } from "@/lib/categories";
import {
  createCategory,
  deleteCategory,
  loadCategoriesForAdmin,
  updateCategory,
} from "@/lib/categoriesStore";
import { useI18n } from "@/lib/i18n";

type FormState = {
  id: string | null;
  en: string;
  fr: string;
  ar: string;
  it: string;
  parentId: string;
};

const emptyForm: FormState = { id: null, en: "", fr: "", ar: "", it: "", parentId: "" };

export default function AdminCategoriesPage() {
  const { t, locale } = useI18n();
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    const result = await loadCategoriesForAdmin();
    setTree(result.tree);
    setReady(result.ready);
    setError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const flatOptions = useMemo(() => {
    const options: { id: string; label: string; depth: number }[] = [];
    const walk = (nodes: CategoryNode[], depth: number) => {
      nodes.forEach((node) => {
        options.push({ id: node.id, label: getLocalizedCategoryName(node, locale, t), depth });
        if (node.children?.length) walk(node.children, depth + 1);
      });
    };
    walk(tree, 0);
    return options;
  }, [tree, locale, t]);

  const blockedParentIds = useMemo(() => {
    if (!form?.id) return new Set<string>();
    const descendants = getCategoryDescendantIds(tree, form.id);
    descendants.add(form.id);
    return descendants;
  }, [form?.id, tree]);

  const openCreate = (parentId = "") => {
    setForm({ ...emptyForm, parentId });
    setFormError("");
  };

  const openEdit = (node: CategoryNode) => {
    const path = findCategoryPath(tree, node.id) || [];
    const parent = path.length > 1 ? path[path.length - 2] : null;
    setForm({
      id: node.id,
      en: node.nameTranslations?.en || "",
      fr: node.nameTranslations?.fr || "",
      ar: node.nameTranslations?.ar || "",
      it: node.nameTranslations?.it || "",
      parentId: parent?.id || "",
    });
    setFormError("");
  };

  const handleSave = async () => {
    if (!form) return;
    const nameTranslations: Record<string, string> = {};
    if (form.en.trim()) nameTranslations.en = form.en.trim();
    if (form.fr.trim()) nameTranslations.fr = form.fr.trim();
    if (form.ar.trim()) nameTranslations.ar = form.ar.trim();
    if (form.it.trim()) nameTranslations.it = form.it.trim();
    if (Object.keys(nameTranslations).length === 0) {
      setFormError("Enter at least one category name.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (form.id) {
        await updateCategory(form.id, { nameTranslations, parentId: form.parentId || null });
      } else {
        await createCategory({ nameTranslations, parentId: form.parentId || null });
      }
      setForm(null);
      await load();
    } catch (err: any) {
      setFormError(err?.message || "Could not save the category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (node: CategoryNode) => {
    if (!confirm(`Delete "${getLocalizedCategoryName(node, locale, t)}" and its subcategories?`)) return;
    try {
      await deleteCategory(node.id);
      await load();
    } catch (err: any) {
      alert(err?.message || "Could not delete the category.");
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: CategoryNode, depth: number) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isOpen = expanded.has(node.id);
    const label = getLocalizedCategoryName(node, locale, t);
    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between gap-3 py-2 border-b border-black/5"
          style={{ paddingLeft: depth * 20 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(node.id)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100"
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className="w-6" />
            )}
            <span className="font-medium truncate">{label}</span>
            <span className="text-xs text-black/40 truncate">{node.id}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => openCreate(node.id)}
              className="p-1.5 rounded hover:bg-gray-100"
              aria-label="Add subcategory"
              disabled={!ready}
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              onClick={() => openEdit(node)}
              className="p-1.5 rounded hover:bg-gray-100"
              aria-label="Edit category"
              disabled={!ready}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(node)}
              className="p-1.5 rounded hover:bg-gray-100 text-red-500"
              aria-label="Delete category"
              disabled={!ready}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        {hasChildren && isOpen && (
          <div>{node.children!.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-black/50">Categories shown in the storefront sidebar.</p>
        </div>
        <button
          type="button"
          onClick={() => openCreate("")}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/80 disabled:opacity-50"
          disabled={!ready}
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {!ready && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold">Categories table is not available yet.</p>
          <p>
            Run <code className="bg-white px-1 rounded">supabase-categories.sql</code> in the Supabase SQL Editor,
            then reload this page. The storefront currently uses the built-in category tree.
          </p>
          {error && <p className="text-amber-800/80">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
          <span className="font-semibold text-sm">Category tree</span>
          <span className="text-xs text-black/40">{flatOptions.length} categories</span>
        </div>
        <div className="p-2">
          {loading ? (
            <div className="py-10 text-center text-black/50">Loading...</div>
          ) : tree.length === 0 ? (
            <div className="py-10 text-center text-black/50">No categories yet.</div>
          ) : (
            tree.map((node) => renderNode(node, 0))
          )}
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
              <h2 className="font-bold text-lg">{form.id ? "Edit category" : "Add category"}</h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="p-1.5 rounded hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm space-y-1">
                  <span className="font-medium">English</span>
                  <input
                    value={form.en}
                    onChange={(e) => setForm({ ...form, en: e.target.value })}
                    className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                    placeholder="Category name"
                  />
                </label>
                <label className="text-sm space-y-1">
                  <span className="font-medium">Français</span>
                  <input
                    value={form.fr}
                    onChange={(e) => setForm({ ...form, fr: e.target.value })}
                    className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                    placeholder="Nom de la catégorie"
                  />
                </label>
                <label className="text-sm space-y-1">
                  <span className="font-medium">العربية</span>
                  <input
                    value={form.ar}
                    onChange={(e) => setForm({ ...form, ar: e.target.value })}
                    className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                    placeholder="اسم الفئة"
                    dir="rtl"
                  />
                </label>
                <label className="text-sm space-y-1">
                  <span className="font-medium">Italiano</span>
                  <input
                    value={form.it}
                    onChange={(e) => setForm({ ...form, it: e.target.value })}
                    className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                    placeholder="Nome categoria"
                  />
                </label>
              </div>
              <label className="text-sm space-y-1 block">
                <span className="font-medium">Parent category</span>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">None (top level)</option>
                  {flatOptions
                    .filter((option) => !blockedParentIds.has(option.id))
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {"— ".repeat(option.depth)}
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-black/10">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-black/10 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-black/80 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
