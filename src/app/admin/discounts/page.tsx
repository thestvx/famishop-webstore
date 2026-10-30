"use client";

import React, { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { MdContentCopy, MdDeleteOutline, MdEdit, MdToggleOn, MdToggleOff } from "react-icons/md";

type Discount = {
  id: number;
  created_at: string;
  name: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  currency: string;
  start_date: string | null;
  expiry_date: string | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  min_order_amount: number | null;
  status: "active" | "inactive";
  applies_to: string;
};

const emptyForm = {
  name: "",
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: "",
  currency: "EUR",
  start_date: "",
  expiry_date: "",
  usage_limit: "",
  per_customer_limit: "",
  min_order_amount: "",
  status: "active" as "active" | "inactive",
};

export default function AdminDiscountsPage() {
  const { t } = useI18n();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toDelete, setToDelete] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    if (!isSupabaseConfigured() || !supabase) return;
    setLoading(true);
    supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && Array.isArray(data)) setDiscounts(data as Discount[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = discounts.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (d: Discount) => {
    setEditing(d);
    setForm({
      name: d.name,
      code: d.code,
      type: d.type,
      value: String(d.value),
      currency: d.currency || "EUR",
      start_date: d.start_date ? d.start_date.slice(0, 16) : "",
      expiry_date: d.expiry_date ? d.expiry_date.slice(0, 16) : "",
      usage_limit: d.usage_limit != null ? String(d.usage_limit) : "",
      per_customer_limit: d.per_customer_limit != null ? String(d.per_customer_limit) : "",
      min_order_amount: d.min_order_amount != null ? String(d.min_order_amount) : "",
      status: d.status,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!supabase) return;
    if (!form.name.trim() || !form.code.trim() || !form.value.trim()) {
      setMessage({ type: "error", text: "Name, code and value are required" });
      return;
    }
    setSaving(true);
    setMessage(null);
    const payload: any = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      currency: form.currency,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      per_customer_limit: form.per_customer_limit ? Number(form.per_customer_limit) : null,
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
      status: form.status,
    };
    try {
      if (editing) {
        const { error } = await supabase.from("discounts").update(payload).eq("id", editing.id);
        if (error) throw error;
        setMessage({ type: "success", text: "Discount updated" });
      } else {
        const { error } = await supabase.from("discounts").insert([payload]);
        if (error) throw error;
        setMessage({ type: "success", text: "Discount created" });
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to save discount" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (d: Discount) => {
    if (!supabase) return;
    const next = d.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("discounts").update({ status: next }).eq("id", d.id);
    if (!error) {
      setDiscounts((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: next } : x)));
    }
  };

  const handleDelete = async () => {
    if (!toDelete || !supabase) return;
    setDeleting(true);
    const { error } = await supabase.from("discounts").delete().eq("id", toDelete.id);
    if (!error) {
      setDiscounts((prev) => prev.filter((x) => x.id !== toDelete.id));
      setMessage({ type: "success", text: "Discount deleted" });
      setToDelete(null);
    } else {
      setMessage({ type: "error", text: error.message });
    }
    setDeleting(false);
  };

  const copyCode = (code: string) => {
    try { navigator.clipboard.writeText(code); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.discounts")}</h1>
          <p className="text-sm text-black/50">{t("admin.discountsDesc")}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium"
        >
          {t("admin.createDiscount")}
        </button>
      </div>

      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.searchDiscounts")}
          className="flex-1 px-3 py-2.5 rounded-xl border border-black/10 text-sm"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-black/10 p-10 text-center text-black/40">
          {t("common.loading")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/10 p-10 text-center text-black/40">
          {t("admin.noDiscounts")}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t("admin.discountName")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.promoCode")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.discountType")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.discountValue")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.usage")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.status")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t border-black/5">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3 font-mono">
                    <button onClick={() => copyCode(d.code)} className="inline-flex items-center gap-1 hover:text-black">
                      {d.code} <MdContentCopy className="text-xs" />
                    </button>
                  </td>
                  <td className="px-4 py-3">{d.type}</td>
                  <td className="px-4 py-3">
                    {d.type === "percentage" ? `${d.value}%` : `${d.value} ${d.currency}`}
                  </td>
                  <td className="px-4 py-3">
                    {d.usage_limit ? `0/${d.usage_limit}` : "∞"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        d.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-black/5" title={t("admin.edit")}>
                        <MdEdit />
                      </button>
                      <button onClick={() => toggleStatus(d)} className="p-1.5 rounded-lg hover:bg-black/5" title={t("admin.toggleStatus")}>
                        {d.status === "active" ? <MdToggleOn className="text-green-600 text-xl" /> : <MdToggleOff className="text-gray-400 text-xl" />}
                      </button>
                      <button onClick={() => setToDelete(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title={t("admin.delete")}>
                        <MdDeleteOutline />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold">{editing ? t("admin.editDiscount") : t("admin.createDiscount")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.discountName")}</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.promoCode")}</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm font-mono" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.discountType")}</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-white">
                  <option value="percentage">{t("admin.percentage")}</option>
                  <option value="fixed">{t("admin.fixedAmount")}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.discountValue")}</label>
                <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              {form.type === "fixed" && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-black/70">{t("admin.currency")}</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-white">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.startDate")}</label>
                <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.expiryDate")}</label>
                <input type="datetime-local" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.usageLimit")}</label>
                <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.perCustomerLimit")}</label>
                <input type="number" value={form.per_customer_limit} onChange={(e) => setForm({ ...form, per_customer_limit: e.target.value })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.minOrderAmount")}</label>
                <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-black/70">{t("admin.status")}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-white">
                  <option value="active">{t("admin.active")}</option>
                  <option value="inactive">{t("admin.inactive")}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} disabled={saving} className="px-5 py-2.5 rounded-full border border-black/10 text-sm font-medium disabled:opacity-50">
                {t("common.cancel")}
              </button>
              <button type="button" onClick={save} disabled={saving} className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium disabled:opacity-50">
                {saving ? t("common.loading") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold">{t("admin.confirmDeleteTitle")}</h2>
            <p className="text-sm text-black/60">{t("admin.confirmDeleteDiscount")}</p>
            <p className="text-sm font-medium">
              {toDelete.code}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setToDelete(null)} disabled={deleting} className="px-5 py-2.5 rounded-full border border-black/10 text-sm font-medium disabled:opacity-50">
                {t("common.cancel")}
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium disabled:opacity-50">
                {deleting ? t("common.loading") : t("admin.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
