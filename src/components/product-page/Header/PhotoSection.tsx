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
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

  useEffect(() => {
    setSelected(images[0]);
  }, [images]);

  const activeImage = images.includes(selected) ? selected : images[0];

  const handleZoomMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

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

      <div
        className="relative flex items-center justify-center bg-[#F0EEED] rounded-[13px] sm:rounded-[20px] w-full max-w-[560px] mx-auto aspect-square overflow-hidden mb-3 lg:mb-0 cursor-zoom-in group"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => {
          setZoomed(false);
          setZoomOrigin("50% 50%");
        }}
        onMouseMove={handleZoomMove}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full h-full flex items-center justify-center"
          >
            <ProductImage
              src={activeImage}
              width={560}
              height={560}
              className="rounded-md w-full h-full object-cover transition-transform duration-200 ease-out will-change-transform"
              style={{
                transform: zoomed ? "scale(1.9)" : "scale(1)",
                transformOrigin: zoomOrigin,
              }}
              alt={title}
              priority
            />
          </motion.div>
        </AnimatePresence>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Zoom
        </span>
      </div>
    </div>
  );
};

export default PhotoSection;
