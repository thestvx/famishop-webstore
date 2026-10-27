"use client";

import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import React from "react";
import * as motion from "framer-motion/client";
import DressStyleCard from "./DressStyleCard";
import { useI18n } from "@/lib/i18n";

const DressStyle = () => {
  const { t } = useI18n();
  return (
    <div className="px-4 xl:px-0">
      <section className="max-w-frame mx-auto bg-[#F0F0F0] px-6 pb-6 pt-10 md:p-[70px] rounded-[40px] text-center">
        <motion.h2
          initial={{ y: "100px", opacity: 0 }}
          whileInView={{ y: "0", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={cn([
            integralCF.className,
            "text-[32px] leading-[36px] md:text-5xl mb-8 md:mb-14 capitalize",
          ])}
        >
          {t("section.browseDressStyle")}
        </motion.h2>
        <motion.div
          initial={{ y: "100px", opacity: 0 }}
          whileInView={{ y: "0", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row md:h-[289px] gap-4 sm:gap-5 mb-4 sm:mb-5"
        >
          <DressStyleCard
            title={t("dressStyle.casual")}
            url="/shop#casual"
            className="flex-1 md:max-w-[260px] lg:max-w-[360px] xl:max-w-[407px] h-[190px] md:h-full bg-[url('/images/dress-style-1.png')]"
          />
          <DressStyleCard
            title={t("dressStyle.formal")}
            url="/shop#formal"
            className="flex-[2] h-[190px] md:h-full bg-[url('/images/dress-style-2.png')]"
          />
        </motion.div>
        <motion.div
          initial={{ y: "100px", opacity: 0 }}
          whileInView={{ y: "0", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-col sm:flex-row md:h-[289px] gap-4 sm:gap-5"
        >
          <DressStyleCard
            title={t("dressStyle.party")}
            url="/shop#party"
            className="flex-[2] h-[190px] md:h-full bg-[url('/images/dress-style-3.png')]"
          />
          <DressStyleCard
            title={t("dressStyle.gym")}
            url="/shop#gym"
            className="flex-1 md:max-w-[260px] lg:max-w-[360px] xl:max-w-[407px] h-[190px] md:h-full bg-[url('/images/dress-style-4.png')]"
          />
        </motion.div>
      </section>
    </div>
  );
};

export default DressStyle;
