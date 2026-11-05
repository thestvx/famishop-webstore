import React from "react";
import ReviewCard from "@/components/common/ReviewCard";
import { useI18n } from "@/lib/i18n";
import { Product } from "@/types/product.types";

const ReviewsContent = ({ data }: { data: Product | null }) => {
  const { t } = useI18n();
  const reviews = data?.reviews || [];

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
    </section>
  );
};

export default ReviewsContent;
