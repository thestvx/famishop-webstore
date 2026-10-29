"use client";

import { useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CartBtn = () => {
  const { cart } = useAppSelector((state: RootState) => state.carts);
  const total = cart?.totalQuantities || 0;
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (total === 0) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 500);
    return () => window.clearTimeout(timer);
  }, [total]);

  return (
    <Link href="/cart" className="relative mr-[14px] p-1">
      <motion.div
        animate={bump ? { scale: [1, 1.35, 0.95, 1], rotate: [0, -12, 12, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Image
          priority
          src="/icons/cart.svg"
          height={100}
          width={100}
          alt="cart"
          className="max-w-[22px] max-h-[22px]"
        />
      </motion.div>
      {cart && cart.totalQuantities > 0 && (
        <motion.span
          key={total}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="border bg-black text-white rounded-full w-fit-h-fit px-1 text-xs absolute -top-3 left-1/2 -translate-x-1/2"
        >
          {cart.totalQuantities}
        </motion.span>
      )}
    </Link>
  );
};

export default CartBtn;
