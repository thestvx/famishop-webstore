"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "fr" | "ar" | "it";
export type Currency = "EUR" | "DZD";
export type Region = "algeria" | "europe";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  region: Region;
  setRegion: (region: Region) => void;
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
    "section.newArrivals": "NEW ARRIVALS",
    "section.topSelling": "TOP SELLING",
    "section.browseDressStyle": "BROWSE BY DRESS STYLE",
    "dressStyle.casual": "Casual",
    "dressStyle.formal": "Formal",
    "dressStyle.gym": "Gym",
    "dressStyle.party": "Party",
    "common.viewAll": "View All",
    "footer.desc": "We have clothes that suits your style and which you're proud to wear. From women to men.",
    "footer.company": "Company",
    "footer.about": "About",
    "footer.features": "Features",
    "footer.works": "Works",
    "footer.career": "Career",
    "footer.help": "Help",
    "footer.customerSupport": "Customer Support",
    "footer.deliveryDetails": "Delivery Details",
    "footer.terms": "Terms & Conditions",
    "footer.privacy": "Privacy Policy",
    "footer.faq": "FAQ",
    "footer.account": "Account",
    "footer.manageDeliveries": "Manage Deliveries",
    "footer.orders": "Orders",
    "footer.payments": "Payments",
    "footer.resources": "Resources",
    "footer.freeEbooks": "Free eBooks",
    "footer.devTutorial": "Development Tutorial",
    "footer.blog": "How to - Blog",
    "footer.youtube": "Youtube Playlist",
    "newsletter.title": "STAY UP TO DATE ABOUT OUR LATEST OFFERS",
    "newsletter.placeholder": "Enter your email address",
    "newsletter.subscribe": "Subscribe to Newsletter",
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
    "section.newArrivals": "NOUVEAUTÉS",
    "section.topSelling": "MEILLEURES VENTES",
    "section.browseDressStyle": "PARCOURIR PAR STYLE",
    "dressStyle.casual": "Décontracté",
    "dressStyle.formal": "Formel",
    "dressStyle.gym": "Sport",
    "dressStyle.party": "Soirée",
    "common.viewAll": "Voir tout",
    "footer.desc": "Nous avons des vêtements qui correspondent à votre style et dont vous serez fier de porter. Pour femmes et hommes.",
    "footer.company": "Entreprise",
    "footer.about": "À propos",
    "footer.features": "Caractéristiques",
    "footer.works": "Comment ça fonctionne",
    "footer.career": "Carrières",
    "footer.help": "Aide",
    "footer.customerSupport": "Service client",
    "footer.deliveryDetails": "Détails de livraison",
    "footer.terms": "Conditions générales",
    "footer.privacy": "Politique de confidentialité",
    "footer.faq": "FAQ",
    "footer.account": "Compte",
    "footer.manageDeliveries": "Gérer les livraisons",
    "footer.orders": "Commandes",
    "footer.payments": "Paiements",
    "footer.resources": "Ressources",
    "footer.freeEbooks": "E-books gratuits",
    "footer.devTutorial": "Tutoriel de développement",
    "footer.blog": "Blog",
    "footer.youtube": "Chaîne YouTube",
    "newsletter.title": "RESTEZ INFORMÉ DE NOS DERNIÈRES OFFRES",
    "newsletter.placeholder": "Entrez votre adresse e-mail",
    "newsletter.subscribe": "S'abonner à la newsletter",
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
    "section.newArrivals": "وصل حديثًا",
    "section.topSelling": "الأكثر مبيعًا",
    "section.browseDressStyle": "تصفح حسب نمط اللباس",
    "dressStyle.casual": "كاجوال",
    "dressStyle.formal": "رسمي",
    "dressStyle.gym": "رياضي",
    "dressStyle.party": "حفلة",
    "common.viewAll": "عرض الكل",
    "footer.desc": "لدينا ملابس تناسب أسلوبك وتفخر بارتدائها، للنساء والرجال.",
    "footer.company": "الشركة",
    "footer.about": "من نحن",
    "footer.features": "المزايا",
    "footer.works": "كيف نعمل",
    "footer.career": "الوظائف",
    "footer.help": "المساعدة",
    "footer.customerSupport": "دعم العملاء",
    "footer.deliveryDetails": "تفاصيل التوصيل",
    "footer.terms": "الشروط والأحكام",
    "footer.privacy": "سياسة الخصوصية",
    "footer.faq": "الأسئلة الشائعة",
    "footer.account": "الحساب",
    "footer.manageDeliveries": "إدارة التوصيل",
    "footer.orders": "الطلبات",
    "footer.payments": "الدفع",
    "footer.resources": "الموارد",
    "footer.freeEbooks": "كتب إلكترونية مجانية",
    "footer.devTutorial": "دروس التطوير",
    "footer.blog": "المدونة",
    "footer.youtube": "قائمة يوتيوب",
    "newsletter.title": "ابقَ على اطلاع بأحدث العروض",
    "newsletter.placeholder": "أدخل بريدك الإلكتروني",
    "newsletter.subscribe": "اشترك في النشرة البريدية",
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
    "section.newArrivals": "NUOVI ARRIVI",
    "section.topSelling": "PIÙ VENDUTI",
    "section.browseDressStyle": "SFOGLIA PER STILE",
    "dressStyle.casual": "Casual",
    "dressStyle.formal": "Formale",
    "dressStyle.gym": "Palestra",
    "dressStyle.party": "Festa",
    "common.viewAll": "Vedi tutto",
    "footer.desc": "Abbiamo abiti adatti al tuo stile e di cui puoi essere orgoglioso di indossare. Per donne e uomini.",
    "footer.company": "Azienda",
    "footer.about": "Chi siamo",
    "footer.features": "Caratteristiche",
    "footer.works": "Come funziona",
    "footer.career": "Carriere",
    "footer.help": "Aiuto",
    "footer.customerSupport": "Supporto clienti",
    "footer.deliveryDetails": "Dettagli di consegna",
    "footer.terms": "Termini e condizioni",
    "footer.privacy": "Informativa sulla privacy",
    "footer.faq": "Domande frequenti",
    "footer.account": "Account",
    "footer.manageDeliveries": "Gestisci consegne",
    "footer.orders": "Ordini",
    "footer.payments": "Pagamenti",
    "footer.resources": "Risorse",
    "footer.freeEbooks": "Ebook gratuiti",
    "footer.devTutorial": "Tutorial di sviluppo",
    "footer.blog": "Blog",
    "footer.youtube": "Playlist YouTube",
    "newsletter.title": "RIMANI AGGIORNATO SULLE NOSTRE ULTIME OFFERTE",
    "newsletter.placeholder": "Inserisci il tuo indirizzo email",
    "newsletter.subscribe": "Iscriviti alla newsletter",
  },
};

const EXCHANGE_RATE_EUR_TO_DZD = 145.0;

const currencySymbols: Record<Currency, string> = {
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

const getInitialRegion = (): Region | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("famishop-region");
  if (stored === "algeria" || stored === "europe") {
    return stored;
  }
  return null;
};

const getInitialCurrency = (region: Region | null): Currency => {
  if (region === "algeria") return "DZD";
  return "EUR";
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [region, setRegionState] = useState<Region | null>(null);
  const [currency, setCurrencyState] = useState<Currency>("EUR");

  useEffect(() => {
    setLocaleState(getInitialLocale());
    const initialRegion = getInitialRegion();
    setRegionState(initialRegion);
    setCurrencyState(getInitialCurrency(initialRegion));
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("famishop-locale", next);
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = next;
    }
  };

  const setRegion = (next: Region) => {
    setRegionState(next);
    const nextCurrency = next === "algeria" ? "DZD" : "EUR";
    setCurrencyState(nextCurrency);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("famishop-region", next);
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
      if (translations[locale] && translations[locale][key]) {
        return translations[locale][key];
      }
      if (translations.en && translations.en[key]) {
        return translations.en[key];
      }
      if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
        console.warn(`Missing translation for key: ${key} (locale: ${locale})`);
      }
      return key;
    };
  }, [locale]);

  const formatPrice = useMemo(() => {
    return (amount: number) => {
      if (region === null) {
        return `${amount.toLocaleString(locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : locale === "it" ? "it-IT" : "ar-EG", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
      if (currency === "DZD") {
        const converted = amount * EXCHANGE_RATE_EUR_TO_DZD;
        return `${Math.round(converted).toLocaleString("fr-DZ")} د.ج`;
      }
      const converted = amount;
      return `${converted.toLocaleString(locale === "fr" ? "fr-FR" : locale === "it" ? "it-IT" : locale === "ar" ? "ar-EG" : "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`;
    };
  }, [currency, locale, region]);

  const value = useMemo(
    () => ({ locale, setLocale, currency, setCurrency, region: region || "europe", setRegion, t, formatPrice }),
    [locale, currency, region, t, formatPrice]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      currency: "EUR" as Currency,
      setCurrency: () => {},
      region: "europe" as Region,
      setRegion: () => {},
      t: (key: string) => key,
      formatPrice: (amount: number) => `€${amount.toFixed(2)}`,
    };
  }
  return ctx;
};

export const useTranslations = () => {
  const { t } = useI18n();
  return t;
};
