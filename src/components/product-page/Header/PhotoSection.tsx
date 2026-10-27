"use client";

import { Product } from "@/types/product.types";
import Image from "next/image";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PhotoSection = ({ data }: { data: Product }) => {
  const [selected, setSelected] = useState<string>(data.srcUrl);

  return (
    <div className="flex flex-col-reverse lg:flex-row lg:gap-3.5">
      {data?.gallery && data.gallery.length > 0 && (
        <div className="flex lg:flex-col gap-3 lg:gap-3.5 w-full lg:w-fit items-center lg:justify-start justify-center">
          {data.gallery.map((photo, index) => (
            <button
              key={index}
              type="button"
              className={`bg-[#F0EEED] rounded-[13px] xl:rounded-[20px] w-full max-w-[111px] xl:max-w-[152px] aspect-square overflow-hidden border-2 transition-colors ${
                selected === photo ? "border-black" : "border-transparent"
              }`}
              onClick={() => setSelected(photo)}
            >
              <Image
                src={photo}
                width={152}
                height={167}
                className="rounded-md w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                alt={data.title}
                priority
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center bg-[#F0EEED] rounded-[13px] sm:rounded-[20px] w-full mx-auto h-full max-h-[530px] min-h-[330px] lg:min-h-[380px] xl:min-h-[530px] overflow-hidden mb-3 lg:mb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full h-full flex items-center justify-center"
          >
            <Image
              src={selected}
              width={444}
              height={530}
              className="rounded-md w-full h-full object-cover"
              alt={data.title}
              priority
              unoptimized
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PhotoSection;
