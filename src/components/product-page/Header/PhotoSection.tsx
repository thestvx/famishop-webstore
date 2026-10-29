"use client";

import { Product } from "@/types/product.types";
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProductImage, { PRODUCT_IMAGE_FALLBACK } from "@/components/common/ProductImage";
import { getLocalizedProductTitle } from "@/lib/productsStore";
import { useI18n } from "@/lib/i18n";

const PhotoSection = ({ data }: { data: Product }) => {
  const { locale } = useI18n();
  const title = getLocalizedProductTitle(data, locale) || "";

  const images = useMemo(() => {
    const gallery = Array.isArray(data.gallery)
      ? data.gallery.filter((photo): photo is string => typeof photo === "string" && photo.trim().length > 0)
      : [];
    const primary = typeof data.srcUrl === "string" && data.srcUrl.trim() ? data.srcUrl.trim() : "";
    const merged = primary ? [primary, ...gallery] : gallery;
    const unique = Array.from(new Set(merged));
    return unique.length > 0 ? unique : [PRODUCT_IMAGE_FALLBACK];
  }, [data.srcUrl, data.gallery]);

  const [selected, setSelected] = useState<string>(images[0]);

  useEffect(() => {
    setSelected(images[0]);
  }, [images]);

  const activeImage = images.includes(selected) ? selected : images[0];

  return (
    <div className="flex flex-col-reverse lg:flex-row lg:gap-3.5">
      {images.length > 1 && (
        <div className="flex lg:flex-col gap-3 lg:gap-3.5 w-full lg:w-fit items-center lg:justify-start justify-center">
          {images.map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              type="button"
              aria-label={`${title} ${index + 1}`}
              className={`bg-[#F0EEED] rounded-[13px] xl:rounded-[20px] w-full max-w-[111px] xl:max-w-[152px] aspect-square overflow-hidden border-2 transition-colors ${
                activeImage === photo ? "border-black" : "border-transparent"
              }`}
              onClick={() => setSelected(photo)}
            >
              <ProductImage
                src={photo}
                width={152}
                height={152}
                className="rounded-md w-full h-full object-contain p-1"
                alt={title}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center bg-[#F0EEED] rounded-[13px] sm:rounded-[20px] w-full max-w-[560px] mx-auto aspect-square overflow-hidden mb-3 lg:mb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full h-full flex items-center justify-center p-3 sm:p-4"
          >
            <ProductImage
              src={activeImage}
              width={560}
              height={560}
              className="rounded-md w-full h-full object-contain"
              alt={title}
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PhotoSection;
