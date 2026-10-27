"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { NavMenu } from "../navbar.types";
import { MenuList } from "./MenuList";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MenuItem } from "./MenuItem";
import Image from "next/image";
import InputGroup from "@/components/ui/input-group";
import ResTopNavbar from "./ResTopNavbar";
import CartBtn from "./CartBtn";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";
import CurrencySwitcher from "@/components/common/CurrencySwitcher";
import { useTranslations } from "@/lib/i18n";

const getData = (t: (key: string) => string): NavMenu => [
  {
    id: 1,
    label: t("nav.shop"),
    type: "MenuList",
    children: [
      {
        id: 11,
        label: t("nav.mensClothes"),
        url: "/shop#men-clothes",
        description: t("nav.mensClothesDesc"),
      },
      {
        id: 12,
        label: t("nav.womensClothes"),
        url: "/shop#women-clothes",
        description: t("nav.womensClothesDesc"),
      },
      {
        id: 13,
        label: t("nav.kidsClothes"),
        url: "/shop#kids-clothes",
        description: t("nav.kidsClothesDesc"),
      },
      {
        id: 14,
        label: t("nav.bagsShoes"),
        url: "/shop#bag-shoes",
        description: t("nav.bagsShoesDesc"),
      },
    ],
  },
  {
    id: 2,
    type: "MenuItem",
    label: t("nav.onSale"),
    url: "/shop#on-sale",
    children: [],
  },
  {
    id: 3,
    type: "MenuItem",
    label: t("nav.newArrivals"),
    url: "/shop#new-arrivals",
    children: [],
  },
  {
    id: 4,
    type: "MenuItem",
    label: t("nav.brands"),
    url: "/shop#brands",
    children: [],
  },
];

const TopNavbar = () => {
  const t = useTranslations();
  const data = getData(t);
  return (
    <nav className="sticky top-0 bg-white z-20">
      <div className="flex relative max-w-frame mx-auto items-center justify-between md:justify-start py-4 md:py-5 px-4 xl:px-0 gap-2 lg:gap-4">
        <div className="flex items-center">
          <div className="block md:hidden mr-2">
            <ResTopNavbar data={data} />
          </div>
          <Link
            href="/"
            className="flex items-center mr-2 lg:mr-6"
            aria-label="Famishop home"
          >
            <Image
              src="/images/Famishoplogo.png"
              alt="Famishop"
              width={180}
              height={54}
              priority
              className="h-10 w-auto sm:h-11 md:h-12 lg:h-14 object-contain"
            />
          </Link>
        </div>
        <NavigationMenu className="hidden md:flex mr-2 lg:mr-7">
          <NavigationMenuList>
            {data.map((item) => (
              <React.Fragment key={item.id}>
                {item.type === "MenuItem" && (
                  <MenuItem label={item.label} url={item.url} />
                )}
                {item.type === "MenuList" && (
                  <MenuList data={item.children} label={item.label} />
                )}
              </React.Fragment>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <InputGroup className="hidden md:flex bg-[#F0F0F0] mr-3 lg:mr-10">
          <InputGroup.Text>
            <Image
              priority
              src="/icons/search.svg"
              height={20}
              width={20}
              alt="search"
              className="min-w-5 min-h-5"
            />
          </InputGroup.Text>
          <InputGroup.Input
            type="search"
            name="search"
            placeholder={t("common.searchPlaceholder")}
            className="bg-transparent placeholder:text-black/40"
          />
        </InputGroup>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden lg:flex items-center gap-2">
            <LocaleSwitcher />
            <CurrencySwitcher />
          </div>
          <Link href="/search" className="block md:hidden mr-[10px] p-1">
            <Image
              priority
              src="/icons/search-black.svg"
              height={100}
              width={100}
              alt="search"
              className="max-w-[22px] max-h-[22px]"
            />
          </Link>
          <CartBtn />
          <Link href="/#signin" className="p-1">
            <Image
              priority
              src="/icons/user.svg"
              height={100}
              width={100}
              alt="user"
              className="max-w-[22px] max-h-[22px]"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
