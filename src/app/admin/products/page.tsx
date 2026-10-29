"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import ProductEditor from "@/components/admin/products/create/ProductEditor";
import { motion, AnimatePresence } from "framer-motion";

type Prod = {
  id: any;
  title: string;
  src_url?: string;
  price: number;
  rating?: number;
  gallery?: string[];
  created_at?: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Prod | null>(null);
  const [form, setForm] = useState<Prod>({ id: null, title: "", price: 0, src_url: "", rating: 0 });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<any>(null);

  async function load() {
    setLoading(true);
    if (!isSupabaseConfigured() || !supabase) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setProducts(data as Prod[]);
    } else {
      setProducts([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(p: Prod) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    if (!isSupabaseConfigured() || !supabase || !p.id) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-black/50">
            {isSupabaseConfigured() ? "Connected to Supabase" : "Supabase not configured"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setEditorOpen(true);
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/80"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-black/50 bg-[#F5F5F5]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Image</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 px-4 text-black/50" colSpan={5}>Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="py-3 px-4 text-black/50" colSpan={5}>No products found in database.</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 hover:bg-[#FAFAFA]">
                    <td className="py-3 px-4">{p.id}</td>
                    <td className="py-3 px-4">{p.title}</td>
                    <td className="py-3 px-4">{p.price}</td>
                    <td className="py-3 px-4">
                      {p.src_url ? (
                        <img src={p.src_url} alt={p.title} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditId(p.id); setEditorOpen(true); }} className="p-1.5 rounded hover:bg-gray-100" aria-label="edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => remove(p)} className="p-1.5 rounded hover:bg-gray-100 text-red-500" aria-label="delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      <AnimatePresence>
        {editorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <ProductEditor
                embedded
                editId={editId}
                onClose={() => {
                  setEditorOpen(false);
                  setEditId(null);
                  load();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
