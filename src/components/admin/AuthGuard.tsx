"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { firebaseAuth, ADMIN_UID } from "@/lib/firebase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u && pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
      if (u && u.uid !== ADMIN_UID && pathname !== "/admin/login") {
        window.location.href = "/admin/login?error=notadmin";
      }
    });
    return () => unsub();
  }, [pathname]);

  // Fallback redirect if onAuthStateChanged doesn't fire
  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) {
        window.location.href = "/admin/login";
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [loading]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F5F5F5] gap-3">
        <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
        <p className="text-sm text-black/50">Loading...</p>
      </div>
    );
  }

  if (!user || user.uid !== ADMIN_UID) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F5F5F5] gap-3">
        <p className="text-sm text-black/50">Redirecting to login...</p>
        <a href="/admin/login" className="text-sm font-medium underline">
          Go to login
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
