import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type DressStyleCardProps = {
  title: string;
  url: string;
  className?: string;
};

const DressStyleCard = ({ title, url, className }: DressStyleCardProps) => {
  return (
    <Link
      href={url}
      className={cn([
        "w-full h-[190px] md:h-full rounded-[20px] bg-white bg-center text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-start bg-no-repeat bg-cover relative overflow-hidden",
        className,
      ])}
    >
      <span className="absolute top-3 md:top-4 start-3 md:start-4 z-10 inline-flex items-center px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/40 backdrop-blur-[6px] border border-white/30 shadow-sm text-black">
        {title}
      </span>
    </Link>
  );
};

export default DressStyleCard;
