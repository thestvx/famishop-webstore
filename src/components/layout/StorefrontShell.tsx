"use client";

import React from "react";
import { usePathname } from "next/navigation";
import TopBanner from "@/components/layout/Banner/TopBanner";
import TopNavbar from "@/components/layout/Navbar/TopNavbar";
import Footer from "@/components/layout/Footer";
import RegionModal from "@/components/common/RegionModal";

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <RegionModal />
      <TopBanner />
      <TopNavbar />
      {children}
      <Footer />
    </>
  );
}
