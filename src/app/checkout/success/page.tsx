"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks/redux";
import { clearCart } from "@/lib/features/carts/cartsSlice";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { fetchOrder } from "@/lib/ordersStore";
import { printOrderReceipt } from "@/lib/receipt";

function ReviewForm({ productId, productName }: { productId: number; productName: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, content: comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setMsg("Submitted. Thank you!");
      setComment("");
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="mb-4 border rounded-xl p-4">
      <div className="font-medium mb-2">{productName}</div>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className={n <= rating ? "text-yellow-500" : "text-gray-300"}>
            ★
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="Your review" />
      <button onClick={submit} disabled={submitting} className="mt-2 rounded-full bg-black text-white px-5 py-2 text-sm">
        {submitting ? "Submitting..." : "Submit review"}
      </button>
      {msg && <p className="text-xs text-black/60 mt-2">{msg}</p>}
    </div>
  );
}

function SuccessContent() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(!!sessionId);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setVerifying(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, orderId }),
        });
        const data = await res.json();
        if (active) {
          setStatus(data?.paid ? "paid" : data?.paymentStatus || "unknown");
          if (data?.paid) {
            dispatch(clearCart());
            try { window.localStorage.removeItem("famishop-checkout"); } catch {}
          }
        }
      } catch {
        if (active) setStatus("unknown");
      } finally {
        if (active) setVerifying(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId, orderId, dispatch]);

  useEffect(() => {
    if (!orderId) return;
    fetchOrder(Number(orderId)).then((o) => setOrder(o)).catch(() => {});
  }, [orderId]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <span className="text-3xl">✓</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("checkout.successTitle")}</h1>
      <p className="text-black/60 mb-2">{t("checkout.successDesc")}</p>
      {verifying && <p className="text-sm text-black/50 mb-4">{t("checkout.verifyingPayment")}</p>}
      {orderId && (
        <p className="text-sm font-medium mb-2">
          {t("checkout.orderNumber")}: <span className="font-bold">#{orderId}</span>
        </p>
      )}
      {order && (
        <button
          onClick={() => printOrderReceipt(order)}
          className="rounded-full bg-black text-white px-8 py-3 text-sm font-medium mb-4"
        >
          Print receipt
        </button>
      )}

      {order && order.items && order.items.length > 0 && (
        <div className="w-full max-w-xl mt-6 text-left">
          <h2 className="text-lg font-bold mb-3">Write a review</h2>
          {order.items.map((it: any, idx: number) => (
            <ReviewForm key={idx} productId={it.id} productName={it.name} />
          ))}
        </div>
      )}
      {status && (
        <p className="text-sm mb-6">
          {t("checkout.paymentStatus")}: <span className="font-bold">{status}</span>
        </p>
      )}
      <Link href="/shop" className="rounded-full bg-black text-white px-8 py-3 text-sm font-medium">
        {t("checkout.continueShopping")}
      </Link>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
