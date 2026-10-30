"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import { clearCart } from "@/lib/features/carts/cartsSlice";
import { useI18n } from "@/lib/i18n";
import ProductImage from "@/components/common/ProductImage";
import { getLocalizedProductTitle } from "@/lib/productsStore";
import { cn } from "@/lib/utils";
// Stripe Checkout is handled via server-side session creation (hosted page).

type Step = 1 | 2 | 3 | 4;
type CountryCode = "FR" | "IT";
type PaymentMethod = "cod" | "stripe";

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: CountryCode;
  region: string;
  city: string;
  address: string;
  postalCode: string;
};

type ShippingOffer = {
  operator: string;
  carrier: string;
  service: string;
  label: string;
  price: number;
  currency: string;
  deliveryType: string;
  deliveryDate: string | null;
  deliveryLabel: string | null;
  category: "domicile" | "relais" | "express";
};

const PHONE_PREFIX: Record<CountryCode, string> = { FR: "+33", IT: "+39" };
const COUNTRY_NAME: Record<CountryCode, string> = { FR: "France", IT: "Italy" };

const initialCustomer: Customer = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "FR",
  region: "France",
  city: "",
  address: "",
  postalCode: "",
};

function nationalDigits(phone: string, country: CountryCode) {
  const digits = phone.replace(/[^\d]/g, "");
  return country === "FR" ? digits.replace(/^0+/, "") : digits;
}

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { cart } = useAppSelector((state: RootState) => state.carts);
  const rehydrated = useAppSelector((state: any) => state?._persist?.rehydrated);
  const { locale, t, formatPrice } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [offers, setOffers] = useState<ShippingOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<ShippingOffer | null>(null);
  const [shippingType, setShippingType] = useState<ShippingOffer["category"] | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const items = useMemo(() => cart?.items || [], [cart?.items]);
  const shippingFee = selectedOffer?.price || 0;
  const phonePrefix = PHONE_PREFIX[customer.country];

  useEffect(() => {
    if (rehydrated && items.length === 0 && !submitting && !orderPlaced) {
      router.replace("/cart/");
    }
  }, [rehydrated, items.length, submitting, orderPlaced, router]);

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

  const total = subtotal + shippingFee;

  const loadShipping = useCallback(
    async (target: Customer) => {
      setShippingLoading(true);
      setShippingError(null);
      setOffers([]);
      setSelectedOffer(null);
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: target.country,
            postalCode: target.postalCode.trim(),
            city: target.city.trim(),
            items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || t("checkout.shippingError"));
        const list: ShippingOffer[] = Array.isArray(data?.offers) ? data.offers : [];
        if (list.length === 0) throw new Error(t("checkout.shippingNoOptions"));
        setOffers(list);
        const firstType = (["domicile", "relais", "express"] as const).find((cat) =>
          list.some((o) => o.category === cat)
        );
        setShippingType(firstType || list[0].category);
        const firstInType = list.find((o) => o.category === (firstType || list[0].category));
        setSelectedOffer(firstInType || list[0]);
      } catch (e: any) {
        setShippingError(e?.message || t("checkout.shippingError"));
      } finally {
        setShippingLoading(false);
      }
    },
    [items, t]
  );

  const validateCustomer = () => {
    const e: Partial<Record<keyof Customer, string>> = {};
    if (!customer.address.trim()) e.address = t("checkout.required");
    if (!customer.city.trim()) e.city = t("checkout.required");
    if (!customer.postalCode.trim()) e.postalCode = t("checkout.required");
    else if (!/^\d{5}$/.test(customer.postalCode.trim())) e.postalCode = t("checkout.invalidPostalCode");
    if (!customer.firstName.trim()) e.firstName = t("checkout.required");
    if (!customer.lastName.trim()) e.lastName = t("checkout.required");
    if (!customer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) e.email = t("checkout.invalidEmail");
    if (nationalDigits(customer.phone, customer.country).length < 6) e.phone = t("checkout.invalidPhone");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateCustomer()) return;
      setStep(2);
      void loadShipping(customer);
      return;
    }
    if (step === 2) {
      if (!selectedOffer) return;
      setStep(3);
      return;
    }
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  };

  const handleBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = {
        currency: (window.localStorage.getItem("famishop-currency") as string) || "EUR",
        customer: {
          ...customer,
          phone: `${phonePrefix}${nationalDigits(customer.phone, customer.country)}`,
          region: COUNTRY_NAME[customer.country],
        },
        items: items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          attributes: i.attributes,
        })),
        shipping: selectedOffer
          ? {
              operator: selectedOffer.operator,
              carrier: selectedOffer.carrier,
              service: selectedOffer.service,
              label: selectedOffer.label,
              price: selectedOffer.price,
              deliveryDate: selectedOffer.deliveryDate,
            }
          : null,
        payment: {
          method: paymentMethod === "stripe" ? "stripe" : "cash_on_delivery",
          status: "pending",
          reference: null,
        },
      };

      // COD: create order directly.
      if (paymentMethod === "cod") {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Order failed");
        setOrderPlaced(true);
        dispatch(clearCart());
        router.push(`/checkout/success/?orderId=${data.orderId}`);
        return;
      }

      // Stripe: create Checkout Session and redirect to hosted payment page.
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Order failed");
      setOrderPlaced(true);
      dispatch(clearCart());
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push(`/checkout/success/?orderId=${data.orderId}`);
      }
    } catch (e: any) {
      setSubmitError(e?.message || t("checkout.orderFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof Customer, label: string, type = "text", extra?: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-black/70">{label}</label>
      {extra ? (
        <div className="flex items-stretch">
          {extra}
          <input
            type={type}
            value={customer[key] as string}
            onChange={(e) => setCustomer((c) => ({ ...c, [key]: e.target.value }))}
            className={cn(
              "w-full px-3 py-2.5 rounded-r-xl border text-sm",
              errors[key] ? "border-red-500" : "border-black/10"
            )}
          />
        </div>
      ) : (
        <input
          type={type}
          value={customer[key] as string}
          onChange={(e) => setCustomer((c) => ({ ...c, [key]: e.target.value }))}
          className={cn(
            "w-full px-3 py-2.5 rounded-xl border text-sm",
            errors[key] ? "border-red-500" : "border-black/10"
          )}
        />
      )}
      {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
    </div>
  );

  const formatDeliveryDate = (value: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(locale || undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
                <div className="sm:col-span-2">{field("address", t("checkout.address"))}</div>
                {field("city", t("checkout.city"))}
                {field("postalCode", t("checkout.postalCode"))}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-black/70">{t("checkout.region")}</label>
                  <select
                    value={customer.country}
                    onChange={(e) => {
                      const country = e.target.value as CountryCode;
                      setCustomer((c) => ({ ...c, country, region: COUNTRY_NAME[country] }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-white"
                  >
                    <option value="FR">{t("checkout.regionFrance")} (+33)</option>
                    <option value="IT">{t("checkout.regionItaly")} (+39)</option>
                  </select>
                </div>
                {field("firstName", t("checkout.firstName"))}
                {field("lastName", t("checkout.lastName"))}
                {field("email", t("checkout.email"), "email")}
                {field(
                  "phone",
                  t("checkout.phone"),
                  "tel",
                  <span className="px-3 flex items-center rounded-l-xl border border-r-0 border-black/10 bg-[#F0F0F0] text-sm text-black/70">
                    {phonePrefix}
                  </span>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-[#F0F0F0] p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{t("checkout.shippingDestination")}</div>
                      <div className="text-black/60">
                        {customer.address}, {customer.postalCode} {customer.city},{" "}
                        {COUNTRY_NAME[customer.country]}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-medium underline underline-offset-2 shrink-0"
                    >
                      {t("checkout.editAddress")}
                    </button>
                  </div>
                </div>
                {shippingLoading && (
                  <div className="p-6 text-center text-sm text-black/50">{t("checkout.shippingLoading")}</div>
                )}
                {!shippingLoading && shippingError && (
                  <div className="space-y-3">
                    <div className="text-sm text-red-500">{shippingError}</div>
                    <button
                      type="button"
                      onClick={() => void loadShipping(customer)}
                      className="px-5 py-2.5 rounded-full border border-black/10 text-sm font-medium"
                    >
                      {t("checkout.shippingRetry")}
                    </button>
                  </div>
                )}
                {!shippingLoading && !shippingError && offers.length > 0 && (
                  <>
                    <div className="text-sm text-black/60 mb-2">{t("checkout.shippingTypePrompt")}</div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {(["domicile", "relais", "express"] as const).map((cat) => {
                        const group = offers.filter((o) => o.category === cat);
                        if (group.length === 0) return null;
                        const cheapest = group.reduce((a, b) => (a.price < b.price ? a : b));
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setShippingType(cat);
                              const first = offers.find((o) => o.category === cat);
                              if (first) setSelectedOffer(first);
                            }}
                            className={cn(
                              "p-3 rounded-xl border text-sm font-medium transition",
                              shippingType === cat ? "border-black bg-black text-white" : "border-black/10 bg-white"
                            )}
                          >
                            <div>{t(`checkout.shippingCategory.${cat}`)}</div>
                            <div className="text-xs opacity-80">
                              {t("checkout.fromPrice")} {formatPrice(cheapest.price)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-sm text-black/60 mb-2">{t("checkout.shippingSelectPrompt")}</div>
                    {offers
                      .filter((o) => o.category === shippingType)
                      .map((offer) => {
                        const key = `${offer.operator}:${offer.service}`;
                        return (
                          <label
                            key={key}
                            className={cn(
                              "flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition mb-2",
                              selectedOffer &&
                                selectedOffer.operator === offer.operator &&
                                selectedOffer.service === offer.service
                                ? "border-black"
                                : "border-black/10"
                            )}
                          >
                            <input
                              type="radio"
                              name="shipping"
                              value={key}
                              checked={
                                !!selectedOffer &&
                                selectedOffer.operator === offer.operator &&
                                selectedOffer.service === offer.service
                              }
                              onChange={() => setSelectedOffer(offer)}
                            />
                            <div>
                              <div className="font-medium">
                                {offer.carrier} - {offer.label}
                              </div>
                              <div className="text-sm text-black/50">
                                {offer.deliveryLabel || t("checkout.deliveryHome")}
                                {offer.deliveryDate
                                  ? ` · ${t("checkout.deliveryEstimate")}: ${formatDeliveryDate(offer.deliveryDate)}`
                                  : ""}
                              </div>
                            </div>
                            <span className="ml-auto font-bold">{formatPrice(offer.price)}</span>
                          </label>
                        );
                      })}
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-black/10 p-4 text-sm space-y-1">
                  <div className="font-medium mb-1">{t("checkout.customerDetails")}</div>
                  <div>
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div className="text-black/60">{customer.email} · {phonePrefix}{nationalDigits(customer.phone, customer.country)}</div>
                  <div className="text-black/60">
                    {customer.address}, {customer.postalCode} {customer.city}, {COUNTRY_NAME[customer.country]}
                  </div>
                </div>
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
                {selectedOffer && (
                  <div className="rounded-xl border border-black/10 p-4 text-sm">
                    <div className="font-medium mb-1">{t("checkout.shippingOptions")}</div>
                    <div>
                      {selectedOffer.carrier} - {selectedOffer.label}
                    </div>
                    {selectedOffer.deliveryDate && (
                      <div className="text-black/50">
                        {t("checkout.deliveryEstimate")}: {formatDeliveryDate(selectedOffer.deliveryDate)}
                      </div>
                    )}
                    <div className="font-bold mt-1">{formatPrice(selectedOffer.price)}</div>
                  </div>
                )}
                <div className="pt-4 border-t text-sm text-black/60">
                  {t("checkout.reviewNote")}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <label
                  className={cn(
                    "flex items-center gap-3 p-4 border rounded-xl cursor-pointer",
                    paymentMethod === "cod" ? "border-black" : "border-black/10"
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <div>
                    <div className="font-medium">{t("checkout.paymentCOD")}</div>
                    <div className="text-sm text-black/50">{t("checkout.paymentCODDesc")}</div>
                  </div>
                </label>
                <label
                  className={cn(
                    "flex items-center gap-3 p-4 border rounded-xl cursor-pointer",
                    paymentMethod === "stripe" ? "border-black" : "border-black/10"
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                  />
                  <div>
                    <div className="font-medium">{t("checkout.paymentCard")}</div>
                    <div className="text-sm text-black/50">{t("checkout.paymentCardDesc")}</div>
                  </div>
                </label>
                {paymentMethod === "stripe" && (
                  <div className="p-4 border border-black/10 rounded-xl text-sm text-black/60">
                    {t("checkout.stripeRedirectNote")}
                  </div>
                )}
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
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 2 && (shippingLoading || !!shippingError || !selectedOffer)}
                  className="px-6 py-3 rounded-full bg-black text-white text-sm font-medium disabled:opacity-50"
                >
                  {t("checkout.continue")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !selectedOffer}
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
                <span className="font-medium">
                  {selectedOffer ? formatPrice(shippingFee) : t("checkout.shippingPending")}
                </span>
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
