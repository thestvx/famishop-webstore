"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

const PHRASES: Record<string, string[]> = {
  en: [
    "Curating your style...",
    "Finding the perfect fit...",
    "Loading fresh arrivals...",
    "Styling your wardrobe...",
    "Almost ready...",
  ],
  fr: [
    "On prépare votre style...",
    "On cherche la coupe parfaite...",
    "Chargement des nouveautés...",
    "On habille votre garde-robe...",
    "Presque prêt...",
  ],
  ar: [
    "نجهز أسلوبك...",
    "نبحث عن القصّة المثالية...",
    "تحميل أحدث الوصولات...",
    "نسق ملابسك...",
    "جاهز تقريباً...",
  ],
  it: [
    "Prepariamo il tuo stile...",
    "Cerchiamo la vestibilità perfetta...",
    "Caricamento delle novità...",
    "Vestiamo il tuo guardaroba...",
    "Quasi pronto...",
  ],
};

const PixelPreloader = () => {
  const pathname = usePathname();
  const { locale } = useI18n();
  const [show, setShow] = useState(true);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    setShow(true);
    setPhraseIndex(Math.floor(Math.random() * 5));
    const timer = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  const phrases = PHRASES[locale] || PHRASES.en;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 64 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0.6, 1], scale: [0, 1, 0.8, 1] }}
                  transition={{
                    duration: 1.2,
                    delay: (i % 8) * 0.03 + Math.floor(i / 8) * 0.05,
                    repeat: Infinity,
                    repeatDelay: 0.6,
                  }}
                  className="block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-black rounded-[2px]"
                />
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-sm sm:text-base font-medium text-black/70"
            >
              {phrases[phraseIndex % phrases.length]}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PixelPreloader;
export { PixelPreloader as Preloader_005 };
