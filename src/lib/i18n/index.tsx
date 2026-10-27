"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "fr" | "ar" | "it";
export type Currency = "USD" | "EUR" | "DZD";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
};

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.shop": "Shop",
    "nav.onSale": "On Sale",
    "nav.newArrivals": "New Arrivals",
    "nav.brands": "Brands",
    "nav.mensClothes": "Men's clothes",
    "nav.womensClothes": "Women's clothes",
    "nav.kidsClothes": "Kids clothes",
    "nav.bagsShoes": "Bags and Shoes",
    "nav.mensClothesDesc": "In attractive and spectacular colors and designs",
    "nav.womensClothesDesc": "Ladies, your style and tastes are important to us",
    "nav.kidsClothesDesc": "For all ages, with happy and beautiful colors",
    "nav.bagsShoesDesc": "Suitable for men, women and all tastes and styles",
    "common.language": "Language",
    "common.currency": "Currency",
    "common.searchPlaceholder": "Search for products...",
    "home.heroTitle": "FIND CLOTHES THAT MATCHES YOUR STYLE",
    "home.heroDesc":
      "Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.",
    "home.shopNow": "Shop Now",
    "home.internationalBrands": "International Brands",
    "home.highQualityProducts": "High-Quality Products",
    "home.happyCustomers": "Happy Customers",
    "announcement.text": "Sign up and get 20% off to your first order.",
    "announcement.signup": "Sign Up Now",
  },
  fr: {
    "nav.shop": "Boutique",
    "nav.onSale": "En solde",
    "nav.newArrivals": "Nouveautés",
    "nav.brands": "Marques",
    "nav.mensClothes": "Vêtements homme",
    "nav.womensClothes": "Vêtements femme",
    "nav.kidsClothes": "Vêtements enfants",
    "nav.bagsShoes": "Sacs et chaussures",
    "nav.mensClothesDesc": "Des couleurs et des designs attractifs et spectaculaires",
    "nav.womensClothesDesc": "Mesdames, votre style et vos goûts sont importants pour nous",
    "nav.kidsClothesDesc": "Pour tous les âges, avec des couleurs joyeuses et belles",
    "nav.bagsShoesDesc": "Adapté aux hommes, aux femmes et à tous les goûts et styles",
    "common.language": "Langue",
    "common.currency": "Devise",
    "common.searchPlaceholder": "Rechercher des produits...",
    "home.heroTitle": "TROUVEZ DES VÊTEMENTS QUI CORRESPONDENT À VOTRE STYLE",
    "home.heroDesc":
      "Parcourez notre gamme diversifiée de vêtements soigneusement conçus, pour mettre en valeur votre individualité et répondre à votre sens du style.",
    "home.shopNow": "Acheter maintenant",
    "home.internationalBrands": "Marques internationales",
    "home.highQualityProducts": "Produits de haute qualité",
    "home.happyCustomers": "Clients satisfaits",
    "announcement.text": "Inscrivez-vous et bénéficiez de 20 % de réduction sur votre première commande.",
    "announcement.signup": "S'inscrire maintenant",
  },
  ar: {
    "nav.shop": "المتجر",
    "nav.onSale": "عرض خاص",
    "nav.newArrivals": "وصل حديثاً",
    "nav.brands": "العلامات التجارية",
    "nav.mensClothes": "ملابس رجالية",
    "nav.womensClothes": "ملابس نسائية",
    "nav.kidsClothes": "ملابس أطفال",
    "nav.bagsShoes": "حقائب وأحذية",
    "nav.mensClothesDesc": "ألوان وتصاميم جذابة ومذهلة",
    "nav.womensClothesDesc": "سيدتي، أسلوبك وأذواقك مهمة جدًا لدينا",
    "nav.kidsClothesDesc": "لجميع الأعمار، بألوان سعيدة وجميلة",
    "nav.bagsShoesDesc": "مناسبة للرجال والنساء ولجميع الأذواق والأنماط",
    "common.language": "اللغة",
    "common.currency": "العملة",
    "common.searchPlaceholder": "ابحث عن المنتجات...",
    "home.heroTitle": "اعثر على ملابس تناسب أسلوبك",
    "home.heroDesc":
      "تصفح مجموعتنا المتنوعة من الملابس المصممة بعناية، لتبرز فرديتك وتلبي ذوقك وأسلوبك الخاص.",
    "home.shopNow": "تسوق الآن",
    "home.internationalBrands": "علامات تجارية عالمية",
    "home.highQualityProducts": "منتجات عالية الجودة",
    "home.happyCustomers": "عملاء سعداء",
    "announcement.text": "سجّل واحصل على خصم ٢٠٪ على أول طلب لك.",
    "announcement.signup": "سجّل الآن",
  },
  it: {
    "nav.shop": "Negozio",
    "nav.onSale": "In offerta",
    "nav.newArrivals": "Nuovi arrivi",
    "nav.brands": "Marchi",
    "nav.mensClothes": "Abbigliamento uomo",
    "nav.womensClothes": "Abbigliamento donna",
    "nav.kidsClothes": "Abbigliamento bambini",
    "nav.bagsShoes": "Borse e scarpe",
    "nav.mensClothesDesc": "Colori e design attraenti e spettacolari",
    "nav.womensClothesDesc": "Signore, il vostro stile e i vostri gusti sono importanti per noi",
    "nav.kidsClothesDesc": "Per tutte le età, con colori allegri e belli",
    "nav.bagsShoesDesc": "Adatto a uomini, donne e tutti i gusti e stili",
    "common.language": "Lingua",
    "common.currency": "Valuta",
    "common.searchPlaceholder": "Cerca prodotti...",
    "home.heroTitle": "TROVA I VESTITI CHE SI ADATTANO AL TUO STILE",
    "home.heroDesc":
      "Sfoglia la nostra vasta gamma di capi meticolosamente realizzati, pensati per esaltare la tua individualità e soddisfare il tuo senso dello stile.",
    "home.shopNow": "Acquista ora",
    "home.internationalBrands": "Marchi internazionali",
    "home.highQualityProducts": "Prodotti di alta qualità",
    "home.happyCustomers": "Clienti soddisfatti",
    "announcement.text": "Iscriviti e ottieni il 20% di sconto sul tuo primo ordine.",
    "announcement.signup": "Iscriviti ora",
  },
};

const currencyRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  DZD: 134.5,
};

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  DZD: "د.ج",
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("famishop-locale");
  if (stored === "en" || stored === "fr" || stored === "ar" || stored === "it") {
    return stored;
  }
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith("ar")) return "ar";
  if (browser.startsWith("fr")) return "fr";
  if (browser.startsWith("it")) return "it";
  return "en";
};

const getInitialCurrency = (): Currency => {
  if (typeof window === "undefined") return "USD";
  const stored = window.localStorage.getItem("famishop-currency");
  if (stored === "USD" || stored === "EUR" || stored === "DZD") {
    return stored;
  }
  return "USD";
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setCurrencyState(getInitialCurrency());
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("famishop-locale", next);
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = next;
    }
  };

  const setCurrency = (next: Currency) => {
    setCurrencyState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("famishop-currency", next);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useMemo(() => {
    return (key: string) => {
      return translations[locale][key] || translations.en[key] || key;
    };
  }, [locale]);

  const formatPrice = useMemo(() => {
    return (amount: number) => {
      const converted = amount * currencyRates[currency];
      const symbol = currencySymbols[currency];
      if (currency === "DZD") {
        return `${Math.round(converted).toLocaleString("fr-DZ")} ${symbol}`;
      }
      return `${symbol}${converted.toLocaleString(locale === "en" ? "en-US" : locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };
  }, [currency, locale]);

  const value = useMemo(
    () => ({ locale, setLocale, currency, setCurrency, t, formatPrice }),
    [locale, currency, t, formatPrice]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      currency: "USD" as Currency,
      setCurrency: () => {},
      t: (key: string) => key,
      formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
    };
  }
  return ctx;
};

export const useTranslations = () => {
  const { t } = useI18n();
  return t;
};
