"use client";

import Image, { ImageProps } from "next/image";
import React, { useEffect, useState } from "react";

export const PRODUCT_IMAGE_FALLBACK = "/images/product-placeholder.svg";

type ProductImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt?: string;
};

function resolveSrc(src?: string | null): string {
  return typeof src === "string" && src.trim() ? src.trim() : PRODUCT_IMAGE_FALLBACK;
}

export default function ProductImage({ src, alt = "", onError, ...props }: ProductImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() => resolveSrc(src));

  useEffect(() => {
    setCurrentSrc(resolveSrc(src));
  }, [src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized
      onError={(event) => {
        if (currentSrc !== PRODUCT_IMAGE_FALLBACK) setCurrentSrc(PRODUCT_IMAGE_FALLBACK);
        onError?.(event);
      }}
    />
  );
}
