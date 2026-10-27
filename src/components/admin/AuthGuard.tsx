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
        router.replace("/admin/login");
      }
      if (u && u.uid !== ADMIN_UID && pathname !== "/admin/login") {
        // authenticated but not admin
        router.replace("/admin/login?error=notadmin");
      }
    });
    return () => unsub();
  }, [router, pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F5F5F5]">
        <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.uid !== ADMIN_UID) {
    return null;
  }

  return <>{children}</>;
}
