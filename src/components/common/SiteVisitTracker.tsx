"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SiteVisitTracker() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    try {
      if (sessionStorage.getItem("famishop-site-visit")) return;
      sessionStorage.setItem("famishop-site-visit", "1");
    } catch {}
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, [pathname]);

  return null;
}
