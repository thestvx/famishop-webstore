"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { loginCustomer } from "@/lib/customerAuth";
import { getCustomerProfile, updateCustomerProfile } from "@/lib/customerStore";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await loginCustomer(email, password);
      if (!user.emailVerified) {
        setError("Please verify your email before signing in.");
        await user.reload();
        if (!user.emailVerified) {
          setLoading(false);
          return;
        }
      }
      const profile = await getCustomerProfile(user.uid);
      if (profile) {
        await updateCustomerProfile(user.uid, { emailVerified: user.emailVerified });
      }
      router.push("/account");
    } catch (err: any) {
      setError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-black/10 p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">{t("auth.signIn")}</h1>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="relative">
            <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm pr-10" placeholder="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/60" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
          </label>
          <button disabled={loading} className="w-full bg-black text-white py-3 rounded-full text-sm font-medium disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm text-black/60">
          <a href="/forgot-password" className="underline">Forgot password?</a>
          <a href="/register" className="underline">Create account</a>
        </div>
      </div>
    </main>
  );
}
