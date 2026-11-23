"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { registerCustomer } from "@/lib/customerAuth";
import { saveCustomerProfile } from "@/lib/customerStore";
import { reload } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";

const COUNTRIES = [
  { code: "FR", dial: "+33", flag: "🇫🇷", name: "France" },
  { code: "IT", dial: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "ES", dial: "+34", flag: "🇪🇸", name: "Spain" },
];

function phoneRegex(countryCode: string) {
  if (countryCode === "FR") return /^(\+33|0)[1-9](?:[ -]?\d{2}){4}$/;
  if (countryCode === "IT") return /^(\+39)?\s?3\d{2}[\s-]?\d{6,7}$/;
  if (countryCode === "ES") return /^(\+34)?\s?[67]\d{2}[\s-]?\d{3}[\s-]?\d{3}$/;
  return /^\d{6,15}$/;
}

function toE164(countryCode: string, raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (countryCode === "FR") {
    if (raw.startsWith("+33")) return `+33${digits.slice(2)}`;
    return `+33${digits.replace(/^0/, "")}`;
  }
  if (countryCode === "IT") {
    if (raw.startsWith("+39")) return `+39${digits.slice(2)}`;
    return `+39${digits.replace(/^0/, "")}`;
  }
  if (countryCode === "ES") {
    if (raw.startsWith("+34")) return `+34${digits.slice(2)}`;
    return `+34${digits.replace(/^0/, "")}`;
  }
  return raw;
}

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("FR");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!isValidPhoneNumber(phone.trim(), countryCode as any)) {
      setError("Veuillez saisir un numéro de téléphone valide pour le pays sélectionné.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms || !privacy) {
      setError("Please accept Terms and Privacy Policy.");
      return;
    }
    setLoading(true);
    try {
      const user = await registerCustomer({
        email,
        password,
        firstName,
        lastName,
        phoneNumber: parsePhoneNumber(phone.trim(), countryCode as any)?.number || phone.trim(),
        countryCode,
      });
      await saveCustomerProfile({
        uid: user.uid,
        firstName,
        lastName,
        email: user.email || email,
        phoneNumber: parsePhoneNumber(phone.trim(), countryCode as any)?.number || phone.trim(),
        countryCode,
        phoneVerified: false,
        emailVerified: false,
        accountStatus: "active",
        marketingOptIn: marketing,
      });
      setSuccess("Account created. Please verify your email before signing in.");
      await reload(user);
    } catch (err: any) {
      setError(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-black/10 p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">{t("auth.createAccount")}</h1>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {success && <div className="mb-4 text-sm text-green-600">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex gap-2">
            <select className="px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-white" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.dial} {c.name}</option>
              ))}
            </select>
            <input className="flex-1 px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="relative">
            <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm pr-10" placeholder="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/60" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button>
          </div>
          <div className="h-2 bg-gray-100 rounded">
            <div className="h-2 rounded bg-black transition-all" style={{ width: `${(strength / 5) * 100}%` }} />
          </div>
          <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Confirm password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> I agree to Terms & Conditions
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> I agree to Privacy Policy
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> Receive offers (optional)
          </label>
          <button disabled={loading} className="w-full bg-black text-white py-3 rounded-full text-sm font-medium disabled:opacity-50">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-black/60">
          Already have an account? <a href="/login" className="underline">Sign in</a>
        </p>
      </div>
    </main>
  );
}
