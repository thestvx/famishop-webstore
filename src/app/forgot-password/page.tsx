"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { resetCustomerPassword } from "@/lib/customerAuth";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await resetCustomerPassword(email);
      setMessage("If an account exists, a reset link has been sent.");
    } catch (err: any) {
      setError(err?.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-black/10 p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">{t("auth.forgotPassword")}</h1>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {message && <div className="mb-4 text-sm text-green-600">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={loading} className="w-full bg-black text-white py-3 rounded-full text-sm font-medium disabled:opacity-50">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>
    </main>
  );
}
