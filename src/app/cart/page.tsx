"use client";

import BreadcrumbCart from "@/components/cart-page/BreadcrumbCart";
import ProductCard from "@/components/cart-page/ProductCard";
import { Button } from "@/components/ui/button";
import InputGroup from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { FaArrowRight } from "react-icons/fa6";
import { MdOutlineLocalOffer } from "react-icons/md";
import { TbBasketExclamation } from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { RootState } from "@/lib/store";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { ensureCartId } from "@/lib/features/carts/cartsSlice";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function CartPage() {
  const { cart, totalPrice, adjustedTotalPrice } = useAppSelector(
    (state: RootState) => state.carts
  );
  const dispatch = useAppDispatch();
  const { t, formatPrice } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (cart && !cart.cartId) dispatch(ensureCartId());
  }, [cart, dispatch]);

  // Keep cartId in the URL for traceability (not sufficient for access control).
  useEffect(() => {
    if (!cart?.cartId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("cartId") !== cart.cartId) {
      params.set("cartId", cart.cartId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [cart?.cartId, router, pathname]);
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("famishop-promo");
      if (raw) setPromo(JSON.parse(raw));
    } catch {}
  }, []);

  const applyPromo = async () => {
    setPromoError(null);
    setPromoLoading(true);
    try {
      const currency = window.localStorage.getItem("famishop-currency") || "EUR";
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, subtotal: totalPrice, currency }),
      });
      const data = await res.json();
      if (!data?.valid) {
        setPromoError(data?.message || "Invalid promo code");
        return;
      }
      setPromo(data);
      window.localStorage.setItem("famishop-promo", JSON.stringify(data));
      setPromoCode("");
    } catch (e: any) {
      setPromoError(e?.message || "Failed to apply promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromo(null);
    window.localStorage.removeItem("famishop-promo");
  };

  const discountAmount = promo?.amount || 0;
  const finalTotal = Math.max((adjustedTotalPrice || totalPrice) - discountAmount, 0);

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        {cart && cart.items.length > 0 ? (
          <>
            <BreadcrumbCart />
            <h2
              className={cn([
                integralCF.className,
                "font-bold text-[32px] md:text-[40px] text-black uppercase mb-5 md:mb-6",
              ])}
            >
              {t("cart.title")}
            </h2>
            <div className="flex flex-col lg:flex-row space-y-5 lg:space-y-0 lg:space-x-5 items-start">
              <div className="w-full p-3.5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-black/10">
                {cart?.items.map((product, idx, arr) => (
                  <React.Fragment key={idx}>
                    <ProductCard data={product} />
                    {arr.length - 1 !== idx && (
                      <hr className="border-t-black/10" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="w-full lg:max-w-[505px] p-5 md:px-6 flex flex-col gap-5 md:gap-6 rounded-[20px] border border-black/10">
                <h6 className="text-xl md:text-2xl font-bold text-black">
                  {t("cart.orderSummary")}
                </h6>
                <div className="flex flex-col space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black/60">{t("cart.subtotal")}</span>
                    <span className="md:text-xl font-bold">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black/60">
                      {t("cart.discount")}
                    </span>
                    <span className="md:text-xl font-bold text-red-600">
                      -{formatPrice(discountAmount + Math.max(totalPrice - adjustedTotalPrice, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black/60">
                      {t("cart.deliveryFee")}
                    </span>
                    <span className="md:text-xl font-bold">{t("cart.calculatedAtCheckout")}</span>
                  </div>
                  <hr className="border-t-black/10" />
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black">{t("cart.total")}</span>
                    <span className="text-xl md:text-2xl font-bold">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>
                {promo ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="text-sm">
                      <span className="font-medium">{promo.code}</span>
                      <span className="text-black/60 ml-2">
                        -{formatPrice(promo.amount)} ({promo.name})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removePromo}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      {t("cart.removePromo")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-stretch gap-3">
                    <InputGroup className="bg-[#F0F0F0] flex-1 min-w-0">
                      <InputGroup.Text>
                        <MdOutlineLocalOffer className="text-black/40 text-2xl" />
                      </InputGroup.Text>
                      <InputGroup.Input
                        type="text"
                        name="code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder={t("cart.promoPlaceholder")}
                        className="bg-transparent placeholder:text-black/40"
                      />
                    </InputGroup>
                    <Button
                      type="button"
                      onClick={applyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="bg-black rounded-full w-[119px] shrink-0 h-[48px] disabled:opacity-50"
                    >
                      {promoLoading ? "..." : t("cart.apply")}
                    </Button>
                  </div>
                )}
                {promoError && <div className="text-xs text-red-500">{promoError}</div>}
                <Link href="/checkout" className="block w-full">
                  <Button
                    type="button"
                    className="text-sm md:text-base font-medium bg-black rounded-full w-full py-4 h-[54px] md:h-[60px] group"
                  >
                    {t("cart.goToCheckout")}{" "}
                    <FaArrowRight className="text-xl ml-2 group-hover:translate-x-1 transition-all" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center flex-col text-gray-300 mt-32">
            <TbBasketExclamation strokeWidth={1} className="text-6xl" />
            <span className="block mb-4">{t("cart.empty")}</span>
            <Button
              asChild
              className="rounded-full px-8 py-3 h-[48px] text-sm md:text-base font-medium bg-black text-white hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 transition"
            >
              <Link href="/shop" className="inline-flex items-center justify-center">
                {t("cart.continueShopping")}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
