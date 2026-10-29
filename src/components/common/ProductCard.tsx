"use client";

import React from "react";
import Rating from "../ui/Rating";
import Link from "next/link";
import { Product } from "@/types/product.types";
import { useI18n } from "@/lib/i18n";
import ProductImage from "@/components/common/ProductImage";
import { getLocalizedProductTitle } from "@/lib/productsStore";

type ProductCardProps = {
  data: Product;
};

const ProductCard = ({ data }: ProductCardProps) => {
  const { formatPrice, locale } = useI18n();
  const title = getLocalizedProductTitle(data, locale) || "";
  const rating = Number.isFinite(data.rating) ? data.rating : 0;
  const discount = data.discount || { amount: 0, percentage: 0 };
  const slug = title.trim().replace(/\s+/g, "-") || "product";

  return (
    <Link
      href={`/shop/product/${data.id}/${encodeURIComponent(slug)}`}
      className="flex flex-col h-full w-full"
    >
      <div className="bg-[#F0EEED] rounded-[13px] lg:rounded-[20px] w-full aspect-square mb-2.5 xl:mb-4 overflow-hidden">
        <ProductImage
          src={data.srcUrl}
          width={295}
          height={295}
          className="rounded-md w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-500"
          alt={title}
          loading="lazy"
        />
      </div>
      <div className="flex flex-col flex-1">
        <strong className="text-black xl:text-xl line-clamp-2 min-h-[2.75rem] xl:min-h-[3.25rem] leading-snug mb-1">
          {title}
        </strong>
        <div className="flex items-center mb-1 xl:mb-2">
          <Rating
            initialValue={rating}
            allowFraction
            SVGclassName="inline-block"
            emptyClassName="fill-gray-50"
            size={19}
            readonly
          />
          <span className="text-black text-xs xl:text-sm ml-[11px] xl:ml-[13px]">
            {rating.toFixed(1)}
            <span className="text-black/60">/5</span>
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 xl:gap-x-2.5 mt-auto">
          {discount.percentage > 0 ? (
            <span className="font-bold text-black text-xl xl:text-2xl">
              {formatPrice(data.price - (data.price * discount.percentage) / 100)}
            </span>
          ) : discount.amount > 0 ? (
            <span className="font-bold text-black text-xl xl:text-2xl">
              {formatPrice(Math.max(data.price - discount.amount, 0))}
            </span>
          ) : (
            <span className="font-bold text-black text-xl xl:text-2xl">
              {formatPrice(data.price)}
            </span>
          )}
          {discount.percentage > 0 && (
            <span className="font-bold text-black/40 line-through text-xl xl:text-2xl">
              {formatPrice(data.price)}
            </span>
          )}
          {discount.amount > 0 && (
            <span className="font-bold text-black/40 line-through text-xl xl:text-2xl">
              {formatPrice(data.price)}
            </span>
          )}
          {discount.percentage > 0 ? (
            <span className="font-medium text-[10px] xl:text-xs py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
              {`-${discount.percentage}%`}
            </span>
          ) : (
            discount.amount > 0 && (
              <span className="font-medium text-[10px] xl:text-xs py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${formatPrice(discount.amount).replace(/[0-9.,]/g, "")}${Math.round(discount.amount)}`}
              </span>
            )
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
