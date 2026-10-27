import Image from "next/image";
import React from "react";

const brandsData: { id: string; srcUrl: string }[] = [
  { id: "versace", srcUrl: "/icons/versace-logo.svg" },
  { id: "zara", srcUrl: "/icons/zara-logo.svg" },
  { id: "gucci", srcUrl: "/icons/gucci-logo.svg" },
  { id: "prada", srcUrl: "/icons/prada-logo.svg" },
  { id: "calvin-klein", srcUrl: "/icons/calvin-klein-logo.svg" },
  { id: "mayoral", srcUrl: "/icons/Mayoral.png" },
  { id: "hm", srcUrl: "/icons/H&M.png" },
  { id: "okaidi", srcUrl: "/icons/Okaidi.png" },
  { id: "chicco", srcUrl: "/icons/Chicco.png" },
  { id: "kiabi", srcUrl: "/icons/Kiabi.png" },
];

const Brands = () => {
  const doubled = [...brandsData, ...brandsData];
  return (
    <div className="bg-black overflow-hidden">
      <div className="max-w-frame mx-auto py-5 md:py-0 sm:px-4 xl:px-0">
        <div className="flex items-center gap-12 animate-[marquee_25s_linear_infinite] w-max">
          {doubled.map((brand, idx) => (
            <Image
              key={`${brand.id}-${idx}`}
              priority
              src={brand.srcUrl}
              height={0}
              width={0}
              alt={brand.id}
              className="h-[26px] lg:h-9 w-auto max-w-[116px] lg:max-w-48 my-5 md:my-11 shrink-0 object-contain"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Brands;
