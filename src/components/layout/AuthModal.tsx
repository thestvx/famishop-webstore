"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useCustomerAuth } from "@/lib/useCustomerAuth";
import { registerCustomer, loginCustomer, resetCustomerPassword } from "@/lib/customerAuth";
import { saveCustomerProfile } from "@/lib/customerStore";

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
  if (countryCode === "FR") return `+33${digits.replace(/^0/, "").replace(/^33/, "").slice(0, 9)}`.slice(0, 12);
  if (countryCode === "IT") return `+39${digits.replace(/^0/, "").replace(/^39/, "").slice(0, 10)}`.slice(0, 13);
  if (countryCode === "ES") return `+34${digits.replace(/^0/, "").replace(/^34/, "").slice(0, 9)}`.slice(0, 12);
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

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useCustomerAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // register
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

  useEffect(() => {
    if (open) {
      setError("");
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && user) {
      onClose();
    }
  }, [open, user, onClose]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginCustomer(loginEmail, loginPassword);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!phoneRegex(countryCode).test(phone.trim())) {
      setError("Invalid phone number for selected country.");
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
      const u = await registerCustomer({
        email,
        password,
        firstName,
        lastName,
        phoneNumber: toE164(countryCode, phone),
        countryCode,
      });
      await saveCustomerProfile({
        uid: u.uid,
        firstName,
        lastName,
        email: u.email || email,
        phoneNumber: toE164(countryCode, phone),
        countryCode,
        phoneVerified: false,
        emailVerified: false,
        accountStatus: "active",
        marketingOptIn: marketing,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const strength = passwordStrength(password);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{mode === "login" ? "Se connecter" : "Créer un compte"}</h3>
          <button type="button" onClick={onClose} className="text-black/60 hover:text-black">✕</button>
        </div>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Adresse e-mail" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <div className="relative">
              <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm pr-10" placeholder="Mot de passe" type={showLoginPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/60" onClick={() => setShowLoginPassword((v) => !v)}>{showLoginPassword ? "Masquer" : "Afficher"}</button>
            </div>
            <button disabled={loading} className="w-full bg-black text-white py-3 rounded-full text-sm font-medium disabled:opacity-50">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            <p className="text-sm text-black/60 text-center">
              Vous n’avez pas de compte ?{" "}
              <button type="button" onClick={() => setMode("register")} className="underline text-black">
                Créez-en un maintenant
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-white" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.dial} {c.name}</option>
                ))}
              </select>
              <input className="flex-1 px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Numéro de téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Adresse e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="relative">
              <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm pr-10" placeholder="Mot de passe" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/60" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Masquer" : "Afficher"}</button>
            </div>
            <div className="h-2 bg-gray-100 rounded">
              <div className="h-2 rounded bg-black transition-all" style={{ width: `${(passwordStrength(password) / 5) * 100}%` }} />
            </div>
            <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" placeholder="Confirmer le mot de passe" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> J'accepte les conditions générales
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> J'accepte la politique de confidentialité
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> Recevoir les offres (optionnel)
            </label>
            <button disabled={loading} className="w-full bg-black text-white py-3 rounded-full text-sm font-medium disabled:opacity-50">
              {loading ? "Création..." : "Créer mon compte"}
            </button>
            <p className="text-sm text-black/60 text-center">
              Vous avez déjà un compte ?{" "}
              <button type="button" onClick={() => setMode("login")} className="underline text-black">
                Connectez-vous
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
