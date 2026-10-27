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
        "w-full h-[190px] md:h-full rounded-[20px] bg-white bg-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-start bg-no-repeat bg-cover relative overflow-hidden",
        className,
      ])}
    >
      <span className="absolute top-4 md:top-6 start-5 md:start-9 z-10 inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm text-black">
        {title}
      </span>
    </Link>
  );
};

export default DressStyleCard;
