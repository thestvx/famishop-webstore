"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCustomerAuth } from "@/lib/useCustomerAuth";
import { getCustomerProfile } from "@/lib/customerStore";
import { useI18n } from "@/lib/i18n";

export default function CustomerWelcome() {
  const { user, loading } = useCustomerAuth();
  const { t, locale } = useI18n();
  const [show, setShow] = useState(false);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    const key = `famishop-welcome-shown-${user.uid}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) return;

    let active = true;
    getCustomerProfile(user.uid)
      .then((profile) => {
        if (!active) return;
        const name = profile?.firstName || user.displayName?.split(" ")[0] || "";
        setFirstName(name);
        setShow(true);
        if (typeof window !== "undefined") sessionStorage.setItem(key, "1");
      })
      .catch(() => {
        if (!active) return;
        setFirstName(user.displayName?.split(" ")[0] || "");
        setShow(true);
        if (typeof window !== "undefined") sessionStorage.setItem(key, "1");
      });

    return () => {
      active = false;
    };
  }, [user, loading]);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, [show]);

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hello = t("welcome.hello").replace("{name}", firstName || (locale === "ar" ? "عميل" : "Customer"));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.35 }}
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.4, ease: "easeOut" }}
            className="mx-4 w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl"
          >
            <div className="mb-4 text-4xl">👋</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("welcome.title")}</h2>
            <p className="text-lg md:text-xl font-semibold mb-2">{hello}</p>
            <p className="text-sm md:text-base text-black/60">{t("welcome.subtitle")}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
