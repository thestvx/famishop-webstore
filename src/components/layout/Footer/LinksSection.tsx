"use client";

import React, { useState } from "react";
import { FooterLinks } from "./footer.types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import FooterModal from "./FooterModal";

const getFooterLinksData = (t: (key: string) => string): FooterLinks[] => [
  {
    id: 1,
    title: t("footer.company"),
    children: [
      { id: 11, label: t("footer.about"), key: "about" },
      { id: 12, label: t("footer.ourStory"), key: "story" },
      { id: 13, label: t("footer.ourCollections"), key: "collections" },
      { id: 14, label: t("footer.careers"), key: "careers" },
    ],
  },
  {
    id: 2,
    title: t("footer.customerService"),
    children: [
      { id: 21, label: t("footer.contactUs"), key: "contact" },
      { id: 22, label: t("footer.shipping"), key: "shipping" },
      { id: 23, label: t("footer.returns"), key: "returns" },
      { id: 24, label: t("footer.terms"), key: "terms" },
      { id: 25, label: t("footer.privacy"), key: "privacy" },
      { id: 26, label: t("footer.faq"), key: "faq" },
    ],
  },
  {
    id: 3,
    title: t("footer.myAccount"),
    children: [
      { id: 31, label: t("footer.myAccount"), key: "account" },
      { id: 32, label: t("footer.myOrders"), key: "orders" },
      { id: 33, label: t("footer.trackOrder"), key: "track" },
      { id: 34, label: t("footer.paymentMethods"), key: "payments" },
    ],
  },
];

const modalTitles: Record<string, string> = {
  about: "About FamiShop",
  story: "Our Story",
  collections: "Explore Our Collections",
  careers: "Join Our Team",
  contact: "We're Here to Help",
  shipping: "Shipping & Delivery",
  returns: "Returns & Refunds",
  terms: "Terms & Conditions",
  privacy: "Privacy Policy",
  faq: "Frequently Asked Questions",
  account: "My Account",
  orders: "My Orders",
  track: "Track My Order",
  payments: "Payment Methods",
};

const LinksSection = () => {
  const { t } = useI18n();
  const [active, setActive] = useState<string | null>(null);
  const footerLinksData = getFooterLinksData(t);
  const title = active ? modalTitles[active] || active : "";

  const renderContent = () => {
    switch (active) {
      case "about":
        return (
          <>
            <p>FamiShop is an online fashion store offering a curated selection of clothing and accessories.</p>
            <p>We focus on a clear, comfortable shopping experience, with easy browsing and a smooth checkout.</p>
          </>
        );
      case "story":
        return (
          <>
            <p>FamiShop was built around a simple idea: make fashion shopping easy, reliable, and enjoyable.</p>
            <p>Our collections are selected to balance style, quality, and everyday comfort.</p>
          </>
        );
      case "collections":
        return (
          <>
            <p>Explore our collections by category on the shop page.</p>
            <p>Use filters to find the right size, color, and style for you.</p>
          </>
        );
      case "careers":
        return <p>We welcome collaboration opportunities. Open positions will be announced when available.</p>;
      case "contact":
        return (
          <>
            <p>Our support team is here to help with products, orders, shipping, and payments.</p>
            <p>Email: support@famishop.fr</p>
            <p>WhatsApp: +33 7 53 13 59 09</p>
          </>
        );
      case "shipping":
        return (
          <>
            <p>Shipping costs are calculated at checkout based on destination, weight, and delivery option.</p>
            <p>Orders are processed and dispatched after confirmation. Tracking is provided when available.</p>
          </>
        );
      case "returns":
        return (
          <>
            <p>If you receive a damaged or incorrect item, contact support to arrange a return or refund.</p>
            <p>Items should be returned in their original condition. Refunds are processed after inspection.</p>
          </>
        );
      case "terms":
        return (
          <>
            <h3 className="font-bold">Introduction</h3>
            <p>By using FamiShop, you agree to these terms and conditions.</p>
            <h3 className="font-bold">Orders</h3>
            <p>Orders are confirmed after successful payment or order placement.</p>
            <h3 className="font-bold">Shipping</h3>
            <p>Shipping timelines depend on the selected carrier and destination.</p>
          </>
        );
      case "privacy":
        return (
          <>
            <p>We collect information necessary to process orders and improve our services.</p>
            <p>Payments are handled by secure providers. We do not store full card details.</p>
          </>
        );
      case "faq":
        return (
          <>
            <h3 className="font-bold">Shopping</h3>
            <p>How can I place an order? Browse products, add to cart, and checkout.</p>
            <h3 className="font-bold">Shipping</h3>
            <p>How much does shipping cost? It is calculated at checkout.</p>
            <h3 className="font-bold">Payments</h3>
            <p>Which payment methods are available? Card payments via Stripe.</p>
          </>
        );
      case "account":
        return <p>Sign in to access your account and manage your profile.</p>;
      case "orders":
        return <p>View your order history after signing in.</p>;
      case "track":
        return (
          <>
            <p>Enter your order number to track your shipment.</p>
            <p>Tracking details are provided when available.</p>
          </>
        );
      case "payments":
        return <p>We accept secure card payments. If a payment fails, please retry or contact support.</p>;
      default:
        return null;
    }
  };

  return (
    <>
      {footerLinksData.map((item) => (
        <section className="flex flex-col mt-5" key={item.id}>
          <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">
            {item.title}
          </h3>
          {item.children.map((link: any) => (
            <button
              type="button"
              onClick={() => setActive(link.key)}
              key={link.id}
              className="text-black/60 text-sm md:text-base mb-4 w-fit text-left hover:text-black transition"
            >
              {link.label}
            </button>
          ))}
        </section>
      ))}
      <FooterModal open={!!active} title={title} onClose={() => setActive(null)}>
        {renderContent()}
      </FooterModal>
    </>
  );
};

export default LinksSection;
