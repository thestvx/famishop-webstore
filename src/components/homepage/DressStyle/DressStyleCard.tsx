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
        "w-full h-[190px] md:h-full rounded-[20px] bg-white bg-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-start py-4 md:py-[25px] px-5 md:px-9 bg-no-repeat bg-cover relative overflow-hidden",
        className,
      ])}
    >
      <span className="relative z-10">{title}</span>
    </Link>
  );
};

export default DressStyleCard;
