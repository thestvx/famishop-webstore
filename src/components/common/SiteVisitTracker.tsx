"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SiteVisitTracker() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    try {
      if (pathname.startsWith("/admin")) {
        // Admin sessions must never be counted as store visits.
        sessionStorage.setItem("famishop-site-visit", "1");
        return;
      }
      if (sessionStorage.getItem("famishop-site-visit")) return;
      sessionStorage.setItem("famishop-site-visit", "1");
    } catch {
      if (pathname.startsWith("/admin")) return;
    }
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, [pathname]);

  return null;
}
