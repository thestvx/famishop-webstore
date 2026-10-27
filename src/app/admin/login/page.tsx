"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, ADMIN_UID } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      if (cred.user.uid !== ADMIN_UID) {
        await firebaseAuth.signOut();
        setError("Access denied: not an admin account.");
        return;
      }
      router.replace("/admin");
    } catch (err: any) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-black/10 shadow-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/images/Famishoplogo02.png"
            alt="Famishop"
            width={180}
            height={54}
            className="h-12 w-auto object-contain mb-4"
          />
          <h1 className="text-2xl font-bold">Admin Sign In</h1>
          <p className="text-sm text-black/50 mt-1">Sign in to manage FamiShop</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg border border-black/10 bg-[#F0F0F0] text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="admin@famishop.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-black/10 bg-[#F0F0F0] text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                aria-label="toggle password"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-black/80 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
