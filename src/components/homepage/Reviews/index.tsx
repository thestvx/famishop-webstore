"use client";

import React from "react";
import * as motion from "framer-motion/client";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { useIsClient, useMediaQuery } from "usehooks-ts";
import ReviewCard from "@/components/common/ReviewCard";
import { Review } from "@/types/review.types";
import { useI18n } from "@/lib/i18n";

type ReviewsProps = { data: Review[] };

const Reviews = ({ data }: ReviewsProps) => {
  const { t } = useI18n();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isClient = useIsClient();

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  if (!isClient) return null;

  return (
    <section className="overflow-hidden">
      <motion.div
        initial={{ x: "100px", opacity: 0 }}
        whileInView={{ x: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
          }}
          className="relative w-full mb-6 md:mb-9"
        >
          <div className="relative max-w-frame mx-auto mb-6 md:mb-10 px-4 xl:px-0">
            <div className="flex flex-col items-center gap-4">
              <motion.h2
                initial={{ y: "100px", opacity: 0 }}
                whileInView={{ y: "0", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className={cn([
                  integralCF.className,
                  "text-[32px] leading-[36px] md:text-5xl capitalize text-center",
                ])}
              >
                {t("reviews.title")}
              </motion.h2>
              <div className="flex items-center gap-2">
                <CarouselPrevious variant="ghost" className="text-2xl static translate-y-0">
                  <FaArrowLeft />
                </CarouselPrevious>
                <CarouselNext variant="ghost" className="text-2xl static translate-y-0">
                  <FaArrowRight />
                </CarouselNext>
              </div>
            </div>
          </div>
          <CarouselContent>
            {data.map((review, index) => (
              <CarouselItem
                key={review.id}
                className="w-full max-w-[358px] sm:max-w-[400px] pl-5"
              >
                <ReviewCard
                  className="h-full"
                  data={review}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </motion.div>
    </section>
  );
};

export default Reviews;
