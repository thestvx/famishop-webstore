"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, X, GripVertical, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadToCloudinaryWithProgress } from "@/lib/cloudinary";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_TREE, findCategoryPath, searchCategories, isLeaf, getSizeType, CategoryNode } from "@/lib/categories";

type View =
  | "main"
  | "category"
  | "size"
  | "condition"
  | "color"
  | "material"
  | "brand"
  | "price"
  | "package";

type UploadedImage = {
  id: string;
  url: string;
  publicId: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const HAT_SIZES = ["One Size", "54", "55", "56", "57", "58", "59", "60"];
const AGE_SIZES = ["0-3 months", "3-6 months", "6-9 months", "9-12 months", "1-2 years", "2-3 years", "3-4 years", "4-5 years", "5-6 years", "6-7 years", "7-8 years", "8-9 years", "9-10 years", "10-11 years", "11-12 years", "12-13 years", "13-14 years", "14-15 years", "15-16 years"];

const COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#808080" },
  { name: "Beige", hex: "#D2B48C" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Red", hex: "#EF4444" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Green", hex: "#22C55E" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Purple", hex: "#A855F7" },
];

const MATERIALS = [
  "Cotton",
  "Leather",
  "Wool",
  "Acrylic",
  "Polyester",
  "Nylon",
  "Linen",
  "Silk",
  "Denim",
  "Metal",
  "Wood",
  "Rubber",
  "Cardboard",
  "Other",
];

const PACKAGE_SIZES = [
  { value: "small", titleKey: "pkg.small", descKey: "pkg.smallDesc" },
  { value: "medium", titleKey: "pkg.medium", descKey: "pkg.mediumDesc" },
  { value: "large", titleKey: "pkg.large", descKey: "pkg.largeDesc" },
];

const CONDITIONS = [
  { value: "newWithTags", titleKey: "cond.newWithTags", descKey: "cond.newWithTagsDesc" },
  { value: "newWithoutTags", titleKey: "cond.newWithoutTags", descKey: "cond.newWithoutTagsDesc" },
  { value: "veryGood", titleKey: "cond.veryGood", descKey: "cond.veryGoodDesc" },
  { value: "good", titleKey: "cond.good", descKey: "cond.goodDesc" },
  { value: "satisfactory", titleKey: "cond.satisfactory", descKey: "cond.satisfactoryDesc" },
];

const BRANDS = ["Versace", "Zara", "Gucci", "Prada", "Calvin Klein", "Mayoral", "H&M", "Okaidi", "Chicco", "Kiabi"];

const DESC_LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "it", label: "Italiano" },
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type ProductEditorProps = {
  open?: boolean;
  embedded?: boolean;
  editId?: string | null;
  onClose?: () => void;
};

export default function ProductEditor({ open = true, embedded = false, editId: editIdProp, onClose }: ProductEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, currency } = useI18n();
  const editId = editIdProp !== undefined ? editIdProp : searchParams.get("id");

  const [view, setView] = useState<View>("main");
  const [categoryLevel, setCategoryLevel] = useState<CategoryNode[]>(CATEGORY_TREE);
  const [categoryStack, setCategoryStack] = useState<CategoryNode[][]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enabledDescLangs, setEnabledDescLangs] = useState<string[]>([]);
  const [descTranslations, setDescTranslations] = useState<Record<string, string>>({});
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryPathNames, setCategoryPathNames] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [priceUsd, setPriceUsd] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [priceDzd, setPriceDzd] = useState("");
  const price = priceEur || priceUsd || priceDzd;
  const [packageSize, setPackageSize] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!editId || !isSupabaseConfigured() || !supabase) return;
    setLoadingProduct(true);
    (async () => {
      try {
        const { data, error } = await supabase.from("products").select("*").eq("id", editId).single();
        if (error) throw error;
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          if (data.description_translations && typeof data.description_translations === "object") {
            setDescTranslations(data.description_translations);
            setEnabledDescLangs(Object.keys(data.description_translations));
          }
          setPriceEur(data.price != null ? String(data.price) : "");
          if (data.prices && typeof data.prices === "object") {
            setPriceUsd(data.prices.USD != null ? String(data.prices.USD) : "");
            setPriceEur(data.prices.EUR != null ? String(data.prices.EUR) : (data.price != null ? String(data.price) : ""));
            setPriceDzd(data.prices.DZD != null ? String(data.prices.DZD) : "");
          }
          setBrand(data.brand || "");
          setSize(data.size || "");
          setCondition(data.condition || "");
          setColors(Array.isArray(data.colors) ? data.colors : []);
          setMaterials(Array.isArray(data.materials) ? data.materials : []);
          setPackageSize(data.package_size || "");
          setCategoryId(data.category || null);
          if (data.category_path) setCategoryPathNames(String(data.category_path).split(" > "));
          else if (data.category) {
            const p = findCategoryPath(CATEGORY_TREE, data.category);
            if (p) setCategoryPathNames(p.map((n) => t(n.nameKey)));
          }
          const urls: string[] = Array.isArray(data.gallery) && data.gallery.length ? data.gallery : data.src_url ? [data.src_url] : [];
          const ids: string[] = Array.isArray(data.public_ids) ? data.public_ids : [];
          setImages(
            urls.map((u, i) => ({
              id: uid(),
              url: u,
              publicId: ids[i] || "",
              progress: 100,
              status: "done",
            }))
          );
        }
      } catch (e: any) {
        setMsg(e?.message || "Failed to load product");
      } finally {
        setLoadingProduct(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const markDirty = () => setDirty(true);

  const primaryImage = images.find((i) => i.status === "done") || null;

  const categoryPathLabel = categoryPathNames.length ? categoryPathNames.join(" > ") : "";

  const sizes = useMemo(() => {
    const type = getSizeType(categoryId);
    if (type === "shoes") return SHOE_SIZES;
    if (type === "hats") return HAT_SIZES;
    if (type === "clothing") return CLOTHING_SIZES;
    return [];
  }, [categoryId]);

  const filteredCategories = useMemo(() => {
    if (categorySearch.trim()) {
      return searchCategories(CATEGORY_TREE, categorySearch);
    }
    return categoryLevel.map((n) => ({ node: n, path: [n] }));
  }, [categorySearch, categoryLevel]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) {
        setMsg(t("addProduct.invalidFileType"));
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        setMsg(t("addProduct.fileTooLarge"));
        continue;
      }
      valid.push(f);
    }
    for (const f of valid) {
      const id = uid();
      setImages((prev) => [...prev, { id, url: "", publicId: "", progress: 0, status: "uploading" }]);
      markDirty();
      try {
        const res = await uploadToCloudinaryWithProgress(f, (p) => {
          setImages((prev) => prev.map((img) => (img.id === id ? { ...img, progress: p } : img)));
        });
        setImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, url: res.url, publicId: res.publicId, progress: 100, status: "done" } : img))
        );
      } catch (e: any) {
        setImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, status: "error", error: e?.message || "Upload failed" } : img))
        );
      }
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    markDirty();
  };

  const makePrimary = (id: string) => {
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
    markDirty();
  };

  const onDragStart = (idx: number) => {
    dragIndex.current = idx;
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === idx) return;
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(dragIndex.current!, 1);
      next.splice(idx, 0, item);
      dragIndex.current = idx;
      return next;
    });
  };
  const onDragEnd = () => {
    dragIndex.current = null;
    markDirty();
  };

  const openCategoryLevel = (node: CategoryNode) => {
    if (node.children && node.children.length) {
      setCategoryStack((prev) => [...prev, categoryLevel]);
      setCategoryLevel(node.children);
      setCategorySearch("");
    } else {
      selectCategory(node, [...categoryPathNames]);
    }
  };

  const selectCategory = (node: CategoryNode, _prev?: string[]) => {
    // build path from root
    const pathNodes = findCategoryPath(CATEGORY_TREE, node.id);
    const names = pathNodes ? pathNodes.map((n) => t(n.nameKey)) : [t(node.nameKey)];
    setCategoryId(node.id);
    setCategoryPathNames(names);
    setView("main");
    setCategoryStack([]);
    setCategoryLevel(CATEGORY_TREE);
    setCategorySearch("");
    markDirty();
  };

  const goBackCategory = () => {
    if (categoryStack.length) {
      const prev = categoryStack[categoryStack.length - 1];
      setCategoryStack((s) => s.slice(0, -1));
      setCategoryLevel(prev);
      setCategorySearch("");
    } else {
      setView("main");
      setCategoryLevel(CATEGORY_TREE);
      setCategoryStack([]);
      setCategorySearch("");
    }
  };

  const handleCategoryRowClick = (item: { node: CategoryNode; path: CategoryNode[] }) => {
    const node = item.node;
    if (node.children && node.children.length) {
      // navigate: set level to children and push current level
      setCategoryStack((prev) => [...prev, categoryLevel]);
      setCategoryLevel(node.children);
      setCategorySearch("");
    } else {
      const names = item.path.map((n) => t(n.nameKey));
      setCategoryId(node.id);
      setCategoryPathNames(names);
      setView("main");
      setCategoryStack([]);
      setCategoryLevel(CATEGORY_TREE);
      setCategorySearch("");
      markDirty();
    }
  };

  const closeEditor = () => {
    if (dirty && !confirm(t("addProduct.unsavedChanges"))) return;
    if (embedded && onClose) onClose();
    else router.push("/admin/products");
  };

  const validate = () => {
    if (!title.trim()) return t("addProduct.titleRequired");
    const p = Number(price);
    if (!price || isNaN(p) || p <= 0) return t("addProduct.priceInvalid");
    const doneImages = images.filter((i) => i.status === "done");
    // images optional
    if (images.some((i) => i.status === "uploading")) return t("addProduct.uploadInProgress");
    return null;
  };

  const handleSave = async (publishStatus: string = "published") => {
    const err = validate();
    if (err) {
      setMsg(err);
      return;
    }
    if (!isSupabaseConfigured() || !supabase) {
      setMsg("Supabase not configured");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const doneImages = images.filter((i) => i.status === "done");
      const urls = doneImages.map((i) => i.url);
      const ids = doneImages.map((i) => i.publicId);
      const primaryUrl = urls[0] || null;

      const fullPayload: any = {
        title: title.trim(),
        status: publishStatus,
        description: description.trim() || null,
        description_translations: descTranslations,
        price: Number(price || 0),
        prices: {
          USD: priceUsd ? Number(priceUsd) : null,
          EUR: priceEur ? Number(priceEur) : null,
          DZD: priceDzd ? Number(priceDzd) : null,
        },
        src_url: primaryUrl,
        gallery: urls,
        rating: 0,
        discount: { amount: 0, percentage: 0 },
        category: categoryId,
        category_path: categoryPathNames.join(" > ") || null,
        brand: brand.trim() || null,
        size: size || null,
        condition: condition || null,
        colors,
        materials,
        package_size: packageSize || null,
        public_ids: ids,
      };

      if (editId) {
        // preserve rating/discount
        const { data: existing } = await supabase.from("products").select("rating,discount").eq("id", editId).single();
        if (existing) {
          fullPayload.rating = existing.rating ?? 0;
          fullPayload.discount = existing.discount ?? { amount: 0, percentage: 0 };
        }
        let { error } = await supabase.from("products").update(fullPayload).eq("id", editId);
        if (error) {
          // fallback base
          const basePayload = {
            title: title.trim(),
            price: Number(price),
            src_url: primaryUrl,
            gallery: urls,
          };
          const r2 = await supabase.from("products").update(basePayload).eq("id", editId);
          if (r2.error) throw r2.error;
        }
      } else {
        let { error } = await supabase.from("products").insert([fullPayload]);
        if (error) {
          const basePayload = {
            title: title.trim(),
            price: Number(price),
            src_url: primaryUrl,
            gallery: urls,
            rating: 0,
            discount: { amount: 0, percentage: 0 },
          };
          const r2 = await supabase.from("products").insert([basePayload]);
          if (r2.error) throw r2.error;
        }
      }
      setDirty(false);
      setMsg(t("addProduct.saved"));
      setTimeout(() => router.push("/admin/products"), 900);
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ---------- subviews ----------

  if (view === "category") {
    const list = filteredCategories;
    return (
      <ScreenShell title={t("addProduct.category")} onBack={categorySearch.trim() ? () => setCategorySearch("") : goBackCategory}>
        <div className="px-4 pt-3">
          <input
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder={t("addProduct.searchCategories")}
            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-sm"
          />
        </div>
        {categorySearch.trim() === "" && categoryStack.length > 0 && (
          <div className="px-4 pt-2 text-xs text-black/40">
            {t("addProduct.browsing")}
          </div>
        )}
        <div className="mt-2 max-h-[60vh] overflow-y-auto">
          {list.map((item, idx) => {
            const node = item.node;
            const hasChildren = !!node.children && node.children.length > 0;
            const selected = categoryId === node.id;
            return (
              <button
                key={node.id + idx}
                onClick={() => handleCategoryRowClick(item)}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-black/5 text-left"
              >
                <div className="flex items-center gap-3">
                  {selected && <Check size={18} className="text-black" />}
                  <span className={selected ? "font-semibold" : ""}>{t(node.nameKey)}</span>
                </div>
                {hasChildren && <ChevronRight size={18} className="text-black/40" />}
              </button>
            );
          })}
          {list.length === 0 && (
            <div className="px-4 py-6 text-sm text-black/50">{t("addProduct.noResults")}</div>
          )}
        </div>
      </ScreenShell>
    );
  }

  if (view === "size") {
    return (
      <ScreenShell title={t("addProduct.size")} onBack={() => setView("main")}>
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="text-sm font-semibold mb-2">{t("addProduct.clothingSizes")}</div>
            <div className="grid grid-cols-3 gap-3">
              {sizes.length === 0 && <div className="col-span-3 text-sm text-black/50">{t("addProduct.noSizes")}</div>}
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setView("main");
                    markDirty();
                  }}
                  className={`py-3 rounded-xl border text-sm font-medium ${
                    size === s ? "bg-black text-white border-black" : "bg-white border-black/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">{t("addProduct.ageSizes")}</div>
            <div className="grid grid-cols-2 gap-3">
              {AGE_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setView("main");
                    markDirty();
                  }}
                  className={`py-3 rounded-xl border text-sm font-medium ${
                    size === s ? "bg-black text-white border-black" : "bg-white border-black/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScreenShell>
    );
  }

  if (view === "condition") {
    return (
      <ScreenShell title={t("addProduct.condition")} onBack={() => setView("main")}>
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setCondition(c.value);
                setView("main");
                markDirty();
              }}
              className="w-full flex items-start gap-3 px-4 py-4 border-b border-black/5 text-left"
            >
              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${condition === c.value ? "border-black" : "border-black/30"}`}>
                {condition === c.value && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
              </div>
              <div>
                <div className="font-medium">{t(c.titleKey)}</div>
                <div className="text-sm text-black/50">{t(c.descKey)}</div>
              </div>
            </button>
          ))}
        </div>
      </ScreenShell>
    );
  }

  if (view === "color") {
    const toggle = (name: string) => {
      setColors((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
      markDirty();
    };
    return (
      <ScreenShell title={t("addProduct.colors")} onBack={() => setView("main")}>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="text-sm font-semibold mb-2">{t("addProduct.suggestedColors")}</div>
          <div className="flex flex-wrap gap-3 mb-6">
            {COLORS.slice(0, 6).map((c) => (
              <button key={c.name} onClick={() => toggle(c.name)} className="flex flex-col items-center gap-1">
                <span
                  className={`w-12 h-12 rounded-full border-2 ${colors.includes(c.name) ? "border-black" : "border-black/10"}`}
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-xs">{t(`color.${c.name}`)}</span>
              </button>
            ))}
          </div>
          <div className="text-sm font-semibold mb-2">{t("addProduct.allColors")}</div>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button key={c.name} onClick={() => toggle(c.name)} className="flex flex-col items-center gap-1">
                <span
                  className={`w-12 h-12 rounded-full border-2 ${colors.includes(c.name) ? "border-black" : "border-black/10"}`}
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-xs">{t(`color.${c.name}`)}</span>
              </button>
            ))}
          </div>
        </div>
        <BottomBar>
          <button
            onClick={() => setView("main")}
            className="w-full bg-black text-white py-3 rounded-xl font-medium"
          >
            {t("addProduct.confirm")}
          </button>
        </BottomBar>
      </ScreenShell>
    );
  }

  if (view === "material") {
    const toggle = (m: string) => {
      setMaterials((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
      markDirty();
    };
    return (
      <ScreenShell title={t("addProduct.material")} onBack={() => setView("main")}>
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {MATERIALS.map((m) => (
            <button
              key={m}
              onClick={() => toggle(m)}
              className="w-full flex items-center justify-between px-4 py-4 border-b border-black/5 text-left"
            >
              <span>{t(`material.${m}`)}</span>
              <span
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${materials.includes(m) ? "bg-black border-black" : "border-black/30"}`}
              >
                {materials.includes(m) && <Check size={14} className="text-white" />}
              </span>
            </button>
          ))}
        </div>
        <BottomBar>
          <button
            onClick={() => setView("main")}
            className="w-full bg-black text-white py-3 rounded-xl font-medium"
          >
            {t("addProduct.confirm")}
          </button>
        </BottomBar>
      </ScreenShell>
    );
  }

  if (view === "brand") {
    const filteredBrands = BRANDS.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()));
    return (
      <ScreenShell title={t("addProduct.brand")} onBack={() => setView("main")}>
        <div className="p-4">
          <input
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder={t("addProduct.searchBrands")}
            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-sm mb-3"
          />
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filteredBrands.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBrand(b);
                  setView("main");
                  markDirty();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left ${brand === b ? "bg-black text-white" : "hover:bg-[#F5F5F5]"}`}
              >
                <span>{b}</span>
                {brand === b && <Check size={16} />}
              </button>
            ))}
            {filteredBrands.length === 0 && brandSearch.trim() && (
              <button
                onClick={() => {
                  setBrand(brandSearch.trim());
                  setView("main");
                  markDirty();
                }}
                className="w-full px-4 py-3 rounded-xl text-left bg-[#F5F5F5]"
              >
                {t("addProduct.useBrand")} "{brandSearch.trim()}"
              </button>
            )}
          </div>
        </div>
      </ScreenShell>
    );
  }

  if (view === "price") {
    return (
      <ScreenShell title={t("addProduct.price")} onBack={() => setView("main")}>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-black/50 mb-1 block">USD ($)</label>
            <input
              type="number"
              inputMode="decimal"
              value={priceUsd}
              onChange={(e) => {
                setPriceUsd(e.target.value);
                markDirty();
              }}
              placeholder="0.00"
              className="w-full text-center text-2xl font-semibold px-4 py-3 rounded-xl border border-black/10"
            />
          </div>
          <div>
            <label className="text-sm text-black/50 mb-1 block">EUR (€)</label>
            <input
              type="number"
              inputMode="decimal"
              value={priceEur}
              onChange={(e) => {
                setPriceEur(e.target.value);
                markDirty();
              }}
              placeholder="0.00"
              className="w-full text-center text-2xl font-semibold px-4 py-3 rounded-xl border border-black/10"
            />
          </div>
          <div>
            <label className="text-sm text-black/50 mb-1 block">DZD (د.ج)</label>
            <input
              type="number"
              inputMode="decimal"
              value={priceDzd}
              onChange={(e) => {
                setPriceDzd(e.target.value);
                markDirty();
              }}
              placeholder="0.00"
              className="w-full text-center text-2xl font-semibold px-4 py-3 rounded-xl border border-black/10"
            />
          </div>
        </div>
        <BottomBar>
          <button
            onClick={() => setView("main")}
            className="w-full bg-black text-white py-3 rounded-xl font-medium"
          >
            {t("addProduct.confirm")}
          </button>
        </BottomBar>
      </ScreenShell>
    );
  }

  if (view === "package") {
    return (
      <ScreenShell title={t("addProduct.packageSize")} onBack={() => setView("main")}>
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {PACKAGE_SIZES.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setPackageSize(p.value);
                setView("main");
                markDirty();
              }}
              className="w-full flex items-start gap-3 px-4 py-4 border-b border-black/5 text-left"
            >
              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${packageSize === p.value ? "border-black" : "border-black/30"}`}>
                {packageSize === p.value && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
              </div>
              <div>
                <div className="font-medium">{t(p.titleKey)}</div>
                <div className="text-sm text-black/50">{t(p.descKey)}</div>
              </div>
            </button>
          ))}
        </div>
      </ScreenShell>
    );
  }

  // ---------- main ----------
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-black/10 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <button onClick={closeEditor} className="flex items-center gap-1 text-sm" aria-label="Back">
            <ChevronLeft size={20} />
            <span>{t("common.back")}</span>
          </button>
          <div className="flex-1 text-center text-base font-semibold">{editId ? t("addProduct.editTitle") : t("addProduct.title")}</div>
          <div className="w-14" />
        </div>
      </header>

      {loadingProduct && (
        <div className="max-w-2xl mx-auto px-4 py-6 text-sm text-black/50">{t("common.loading")}</div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Photos */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-black/70 mb-3">{t("addProduct.photos")}</h2>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="bg-white rounded-2xl border border-dashed border-black/20 p-4"
          >
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={onDragEnd}
                  className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-black/10 bg-[#F5F5F5]"
                >
                  {img.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    </div>
                  )}
                  {img.status === "done" && img.url && (
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  )}
                  {img.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500 p-1 text-center">
                      {img.error}
                    </div>
                  )}
                  {idx === 0 && img.status === "done" && (
                    <span className="absolute top-1 left-1 text-[10px] bg-black text-white px-1.5 py-0.5 rounded">
                      {t("addProduct.primary")}
                    </span>
                  )}
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      onClick={() => removeImage(img.id)}
                      className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                      aria-label="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {img.status === "done" && idx !== 0 && (
                    <button
                      onClick={() => makePrimary(img.id)}
                      className="absolute bottom-1 left-1 text-[10px] bg-white/90 px-1.5 py-0.5 rounded"
                    >
                      {t("addProduct.makePrimary")}
                    </button>
                  )}
                  <div className="absolute bottom-1 right-1 text-white/80">
                    <GripVertical size={12} />
                  </div>
                  {img.status === "uploading" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                      <div className="h-full bg-black" style={{ width: `${img.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}

              <label className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-black/20 flex flex-col items-center justify-center text-black/50 cursor-pointer hover:bg-[#F5F5F5]">
                <Plus size={20} />
                <span className="text-[10px] mt-1">{t("addProduct.addPhoto")}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-black/40 mt-2">{t("addProduct.dragHint")}</p>
          </div>
        </section>

        {/* Presentation */}
        <section className="mb-6 bg-white rounded-2xl border border-black/10 p-4">
          <h2 className="text-sm font-semibold text-black/70 mb-3">{t("addProduct.presentation")}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-black/70">{t("addProduct.titleField")}</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                }}
                placeholder={t("addProduct.titlePlaceholder")}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-black/10"
              />
            </div>
            <div>
              <label className="text-sm text-black/70">{t("addProduct.description")}</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markDirty();
                }}
                placeholder={t("addProduct.descriptionPlaceholder")}
                rows={5}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-black/10 resize-none"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {DESC_LANGS.map((l) => {
                  const active = enabledDescLangs.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={async () => {
                        if (active) {
                          setEnabledDescLangs((prev) => prev.filter((c) => c !== l.code));
                          setDescTranslations((prev) => {
                            const next = { ...prev };
                            delete next[l.code];
                            return next;
                          });
                          markDirty();
                        } else {
                          setEnabledDescLangs((prev) => [...prev, l.code]);
                          if (!descTranslations[l.code] && description.trim()) {
                            try {
                              const res = await fetch("/api/translate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ text: description, source: "auto", target: l.code }),
                              });
                              const data = await res.json();
                              if (data?.translated) {
                                setDescTranslations((prev) => ({ ...prev, [l.code]: data.translated }));
                              }
                            } catch {}
                          }
                          markDirty();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        active ? "bg-black text-white border-black" : "bg-white text-black/60 border-black/10"
                      }`}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
              {enabledDescLangs.length > 0 && (
                <div className="mt-3 space-y-3">
                  {enabledDescLangs.map((code) => {
                    const lang = DESC_LANGS.find((l) => l.code === code);
                    return (
                      <div key={code}>
                        <label className="text-sm text-black/70">{lang?.label}</label>
                        <textarea
                          value={descTranslations[code] || ""}
                          onChange={(e) => {
                            setDescTranslations((prev) => ({ ...prev, [code]: e.target.value }));
                            markDirty();
                          }}
                          rows={4}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-black/10 resize-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Details rows */}
        <section className="mb-6 bg-white rounded-2xl border border-black/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-black/70 px-4 pt-4 mb-1">{t("addProduct.details")}</h2>
          <Row label={t("addProduct.category")} value={categoryPathLabel || (categoryId ? categoryId : "")} onClick={() => setView("category")} />
          <Row label={t("addProduct.brand")} value={brand} onClick={() => setView("brand")} />
          <Row label={t("addProduct.size")} value={size} onClick={() => setView("size")} disabled={!categoryId} />
          <Row label={t("addProduct.condition")} value={condition ? t(`cond.${condition}`) : ""} onClick={() => setView("condition")} />
          <Row label={t("addProduct.colors")} value={colors.map((c) => t(`color.${c}`)).join(", ")} onClick={() => setView("color")} />
          <Row label={t("addProduct.material")} value={materials.map((m) => t(`material.${m}`)).join(", ")} onClick={() => setView("material")} />
          <Row label={t("addProduct.price")} value={price ? `${price} ${currency}` : ""} onClick={() => setView("price")} />
          <Row label={t("addProduct.packageSize")} value={packageSize ? t(`pkg.${packageSize}`) : ""} onClick={() => setView("package")} />
        </section>

        {msg && <p className="text-sm text-black/70 mb-4">{msg}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => handleSave("draft")}
            disabled={saving || images.some((i) => i.status === "uploading")}
            className="flex-1 bg-white border border-black/10 text-black py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {saving ? t("addProduct.saving") : t("addProduct.saveDraft")}
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving || images.some((i) => i.status === "uploading")}
            className="flex-1 bg-black text-white py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {saving ? t("addProduct.saving") : t("addProduct.save")}
          </button>
        </div>
      </main>
    </div>
  );
}

function ScreenShell({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-black/10 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <button onClick={onBack} className="flex items-center gap-1 text-sm" aria-label="Back">
            <ChevronLeft size={20} />
            <span>{t("common.back")}</span>
          </button>
          <div className="flex-1 text-center text-base font-semibold">{title}</div>
          <div className="w-14" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto pb-28">{children}</main>
    </div>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4">
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );
}

function Row({ label, value, onClick, disabled }: { label: string; value: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-4 py-4 border-t border-black/5 text-left ${disabled ? "opacity-40" : ""}`}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2 text-sm text-black/50">
        <span className="truncate max-w-[200px]">{value || ""}</span>
        <Plus size={16} />
      </div>
    </button>
  );
}