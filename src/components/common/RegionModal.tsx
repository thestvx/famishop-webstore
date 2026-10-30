"use client";

import React, { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

const RegionModal = () => {
  const { setRegion, setCurrency } = useI18n() as any;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("famishop-region", "europe");
    if (typeof setRegion === "function") setRegion("europe");
    if (typeof setCurrency === "function") setCurrency("EUR");
  }, [setRegion, setCurrency]);

  return null;
};

export default RegionModal;
