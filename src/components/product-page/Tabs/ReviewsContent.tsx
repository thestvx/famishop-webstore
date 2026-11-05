import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import ReviewCard from "@/components/common/ReviewCard";
import { useI18n } from "@/lib/i18n";
import { Product } from "@/types/product.types";

const ReviewsContent = ({ data }: { data: Product | null }) => {
  const { t } = useI18n();
  const reviews = data?.reviews || [];
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!data?.id) return;
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: data.id, rating, content: comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setMessage("Review submitted. Refresh to see it.");
      setComment("");
    } catch (e: any) {
      setMessage(e?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between flex-col sm:flex-row mb-5 sm:mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <h3 className="text-xl sm:text-2xl font-bold text-black mr-2">
            {t("product.allReviews")}
          </h3>
          <span className="text-sm sm:text-base text-black/60">({reviews.length})</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 sm:mb-9">
        {reviews.length === 0 && <p className="text-black/60">No reviews yet.</p>}
        {reviews.map((review) => (
          <ReviewCard key={review.id} data={review} isAction isDate />
        ))}
      </div>
      <div className="border-t pt-4 space-y-3">
        <h4 className="font-bold">Write a review</h4>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className={n <= rating ? "text-yellow-500" : "text-gray-300"}>
              ★
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm"
          rows={3}
          placeholder="Your review"
        />
        <Button onClick={submit} disabled={submitting} className="rounded-full bg-black text-white px-6">
          {submitting ? "Submitting..." : t("product.writeReview")}
        </Button>
        {message && <p className="text-sm text-black/60">{message}</p>}
      </div>
    </section>
  );
};

export default ReviewsContent;
