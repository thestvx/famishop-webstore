"use client";

import InputGroup from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import React from "react";
import { useI18n } from "@/lib/i18n";

const NewsLetterSection = () => {
  const { t } = useI18n();
  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 max-w-frame mx-auto bg-black rounded-[20px] px-6 sm:px-10 lg:px-16 py-9 md:py-11">
      <p
        className={cn([
          integralCF.className,
          "font-bold text-[32px] md:text-[40px] text-white mb-9 md:mb-0",
        ])}
      >
        {t("newsletter.title")}
      </p>
      <div className="flex items-center">
        <div className="flex flex-col w-full max-w-[349px] mx-auto">
          <InputGroup className="bg-white mb-[14px]">
            <InputGroup.Text>
              <img
                src="/icons/envelope.svg"
                height={20}
                width={20}
                alt="email"
                className="min-w-5 min-h-5"
              />
            </InputGroup.Text>
            <InputGroup.Input
              type="email"
              name="email"
              className="bg-transparent placeholder:text-black/40"
              placeholder={t("newsletter.placeholder")}
            />
          </InputGroup>
          <button
            type="submit"
            className="text-sm sm:text-base font-medium bg-white h-12 rounded-full px-4 py-3"
          >
            {t("newsletter.subscribe")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsLetterSection;
