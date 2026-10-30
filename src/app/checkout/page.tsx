"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import { clearCart } from "@/lib/features/carts/cartsSlice";
import { useI18n } from "@/lib/i18n";
import ProductImage from "@/components/common/ProductImage";
import { getLocalizedProductTitle } from "@/lib/productsStore";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  address: string;
  postalCode: string;
};

const initialCustomer: Customer = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  region: "",
  city: "",
  address: "",
  postalCode: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { cart } = useAppSelector((state: RootState) => state.carts);
  const rehydrated = useAppSelector((state: any) => state?._persist?.rehydrated);
  const { locale, t, formatPrice } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const items = cart?.items || [];

  useEffect(() => {
    if (rehydrated && items.length === 0 && !submitting) {
      router.replace("/cart/");
    }
  }, [rehydrated, items.length, submitting, router]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unit =
          item.discount?.percentage > 0
            ? item.price - (item.price * item.discount.percentage) / 100
            : item.discount?.amount > 0
            ? Math.max(item.price - item.discount.amount, 0)
            : item.price;
        return sum + unit * item.quantity;
      }, 0),
    [items]
  );

  const total = subtotal; // shipping 0, tax 0, discount 0

  const validateCustomer = () => {
    const e: Partial<Record<keyof Customer, string>> = {};
    if (!customer.firstName.trim()) e.firstName = t("checkout.required");
    if (!customer.lastName.trim()) e.lastName = t("checkout.required");
    if (!customer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) e.email = t("checkout.invalidEmail");
    if (!customer.phone.trim()) e.phone = t("checkout.required");
    if (!customer.country.trim()) e.country = t("checkout.required");
    if (!customer.city.trim()) e.city = t("checkout.required");
    if (!customer.address.trim()) e.address = t("checkout.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateCustomer()) return;
    }
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  };

  const handleBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        currency: (window.localStorage.getItem("famishop-currency") as string) || "EUR",
        customer,
        items: items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          attributes: i.attributes,
        })),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Order failed");
      dispatch(clearCart());
      router.push(`/checkout/success?orderId=${data.orderId}`);
    } catch (e: any) {
      setSubmitError(e?.message || t("checkout.orderFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof Customer, label: string, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-black/70">{label}</label>
      <input
        type={type}
        value={customer[key]}
        onChange={(e) => setCustomer((c) => ({ ...c, [key]: e.target.value }))}
        className={cn(
          "w-full px-3 py-2.5 rounded-xl border text-sm",
          errors[key] ? "border-red-500" : "border-black/10"
        )}
      />
      {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
    </div>
  );

  if (!rehydrated) {
    return (
      <main className="pb-20">
        <div className="max-w-frame mx-auto px-4 xl:px-0 py-16 text-center text-black/50">
          {t("common.loading")}
        </div>
      </main>
    );
  }

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{t("checkout.title")}</h1>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  step >= n ? "bg-black text-white" : "bg-[#F0F0F0] text-black/50"
                )}
              >
                {n}
              </div>
              <span className={cn("text-sm whitespace-nowrap", step >= n ? "text-black" : "text-black/40")}>
                {n === 1 && t("checkout.stepCustomer")}
                {n === 2 && t("checkout.stepShipping")}
                {n === 3 && t("checkout.stepReview")}
                {n === 4 && t("checkout.stepPayment")}
              </span>
              {n < 4 && <div className="w-8 h-px bg-black/10" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-black/10 p-5 md:p-6">
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field("firstName", t("checkout.firstName"))}
                {field("lastName", t("checkout.lastName"))}
                {field("email", t("checkout.email"), "email")}
                {field("phone", t("checkout.phone"), "tel")}
                {field("country", t("checkout.country"))}
                {field("region", t("checkout.region"))}
                {field("city", t("checkout.city"))}
                {field("address", t("checkout.address"))}
                {field("postalCode", t("checkout.postalCode"))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shippingMethod === "standard"}
                    onChange={() => setShippingMethod("standard")}
                  />
                  <div>
                    <div className="font-medium">{t("checkout.shippingStandard")}</div>
                    <div className="text-sm text-black/50">{t("checkout.shippingStandardDesc")}</div>
                  </div>
                  <span className="ml-auto font-bold">{formatPrice(0)}</span>
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const title = getLocalizedProductTitle({ ...item, title: item.name, srcUrl: item.srcUrl, price: item.price, discount: item.discount, rating: 0 } as any, locale) || item.name;
                  return (
                    <div key={idx} className="flex gap-3 items-center">
                      <ProductImage src={item.srcUrl} width={64} height={64} className="w-16 h-16 rounded-lg object-contain bg-[#F0EEED]" alt={title} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{title}</div>
                        <div className="text-xs text-black/50">
                          {item.attributes.filter(Boolean).join(" / ")} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  );
                })}
                <div className="pt-4 border-t text-sm text-black/60">
                  {t("checkout.reviewNote")}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer">
                  <input type="radio" name="payment" value="cod" checked readOnly />
                  <div>
                    <div className="font-medium">{t("checkout.paymentCOD")}</div>
                    <div className="text-sm text-black/50">{t("checkout.paymentCODDesc")}</div>
                  </div>
                </label>
                {submitError && <div className="text-sm text-red-500">{submitError}</div>}
              </div>
            )}

            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <button type="button" onClick={handleBack} className="px-6 py-3 rounded-full border border-black/10 text-sm font-medium">
                  {t("common.back")}
                </button>
              ) : (
                <Link href="/cart" className="px-6 py-3 rounded-full border border-black/10 text-sm font-medium">
                  {t("common.back")}
                </Link>
              )}
              {step < 4 ? (
                <button type="button" onClick={handleNext} className="px-6 py-3 rounded-full bg-black text-white text-sm font-medium">
                  {t("checkout.continue")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-3 rounded-full bg-black text-white text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? t("checkout.placingOrder") : t("checkout.placeOrder")}
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-black/10 p-5 md:p-6 h-fit">
            <h2 className="font-bold text-lg mb-4">{t("cart.orderSummary")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black/60">{t("cart.subtotal")}</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">{t("cart.shipping")}</span>
                <span className="font-medium">{formatPrice(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">{t("cart.tax")}</span>
                <span className="font-medium">{formatPrice(0)}</span>
              </div>
              <hr className="border-t-black/10 my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>{t("cart.total")}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
