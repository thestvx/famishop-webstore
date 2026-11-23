"use client";

import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

export function useCustomerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}
