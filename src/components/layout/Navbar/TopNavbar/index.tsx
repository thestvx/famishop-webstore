"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useI18n, useTranslations } from "@/lib/i18n";
import { fetchProducts } from "@/lib/productsStore";
import { getLocalizedProductTitle } from "@/lib/productsStore";
import { Product } from "@/types/product.types";
import ProductImage from "@/components/common/ProductImage";

const getData = (t: (key: string) => string): NavMenu => [
  {
    id: 1,
    label: t("nav.shop"),
    type: "MenuList",
    children: [
      {
         id: 11,
         label: t("nav.mensClothes"),
         url: "/shop#vetements-homme",
         description: t("nav.mensClothesDesc"),
       },
       {
         id: 12,
         label: t("nav.womensClothes"),
         url: "/shop#vetements-femme",
         description: t("nav.womensClothesDesc"),
       },
       {
         id: 13,
         label: t("nav.kidsClothes"),
         url: "/shop#vetements-enfants",
         description: t("nav.kidsClothesDesc"),
       },
       {
         id: 14,
         label: t("nav.bagsShoes"),
         url: "/shop#sacs-chaussures",
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
  const { region, setRegion, locale } = useI18n() as any;
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  const data = getData(t);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((loaded) => {
        if (active) setProducts(loaded);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const suggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((product) => {
        const title = getLocalizedProductTitle(product, locale || "en") || product.title || "";
        const haystack = [title, product.title, product.brand].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [products, searchTerm, locale]);
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchTerm.trim();
    router.push(query ? `/search/?q=${encodeURIComponent(query)}` : "/search/");
  };
  return (
    <nav className="sticky top-0 bg-white z-20 border-b border-black/5">
      <div className="flex relative max-w-[1380px] mx-auto items-center justify-between gap-2 sm:gap-3 lg:gap-6 py-2.5 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 xl:px-10">
        <div className="flex items-center">
          <div className="block md:hidden mr-2 rtl:ml-2 rtl:mr-0">
            <ResTopNavbar data={data} />
          </div>
          <Link
            href="/"
            className="flex items-center"
            aria-label="Famishop home"
          >
            <Image
              src="/images/Famishoplogo02.png"
              alt="Famishop"
              width={380}
              height={114}
              priority
              className="h-[56px] w-auto sm:h-[64px] md:h-[72px] lg:h-[80px] xl:h-[88px] object-contain flex-shrink-0"
            />
          </Link>
        </div>
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1 lg:gap-3 xl:gap-5">
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
        <form onSubmit={submitSearch} className="hidden lg:block relative" ref={searchRef}>
          <InputGroup className="flex bg-[#F0F0F0] w-[320px] xl:w-[380px]">
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
              value={searchTerm}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t("common.searchPlaceholder")}
              className="bg-transparent placeholder:text-black/40"
            />
          </InputGroup>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-black/10 bg-white shadow-lg max-h-80 overflow-auto">
              {suggestions.map((product) => {
                const title = getLocalizedProductTitle(product, locale || "en") || product.title || "";
                const slug = title.trim().replace(/\s+/g, "-") || "product";
                return (
                  <Link
                    key={product.id}
                    href={`/shop/product/${product.id}/${encodeURIComponent(slug)}`}
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchTerm("");
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#F0F0F0]"
                  >
                    <ProductImage
                      src={product.srcUrl}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-md object-contain bg-[#F0EEED]"
                      alt={title}
                    />
                    <span className="text-sm line-clamp-1">{title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </form>
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
          <div className="hidden xl:flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("famishop-region");
                  window.location.reload();
                }
              }}
              className="text-sm px-2 py-1 rounded-md hover:bg-gray-100 whitespace-nowrap"
            >
              Europe
            </button>
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
