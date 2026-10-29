"use client";

import { addToCart } from "@/lib/features/carts/cartsSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import { Product } from "@/types/product.types";
import { getLocalizedProductTitle } from "@/lib/productsStore";
import { useI18n } from "@/lib/i18n";
import React, { useState } from "react";
import { motion } from "framer-motion";

const AddToCartBtn = ({ data }: { data: Product & { quantity: number } }) => {
  const dispatch = useAppDispatch();
  const { sizeSelection, colorSelection } = useAppSelector(
    (state: RootState) => state.products
  );
  const { locale, t } = useI18n();
  const [animating, setAnimating] = useState(false);

  const title = getLocalizedProductTitle(data, locale) || t("product.untitled");

  const handleClick = () => {
    setAnimating(true);
    dispatch(
      addToCart({
        id: data.id,
        name: title,
        srcUrl: data.srcUrl,
        price: data.price,
        attributes: [sizeSelection, colorSelection.name],
        discount: data.discount,
        stock: data.stock,
        quantity: data.quantity,
      })
    );
    window.setTimeout(() => setAnimating(false), 650);
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      animate={animating ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="bg-black w-full ml-3 sm:ml-5 rounded-full h-11 md:h-[52px] text-sm sm:text-base text-white hover:bg-black/80 transition-colors relative overflow-hidden"
      onClick={handleClick}
    >
      <motion.span
        animate={animating ? { y: [0, -2, 0] } : { y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="inline-block"
      >
        {t("product.addToCart")}
      </motion.span>
    </motion.button>
  );
};

export default AddToCartBtn;
