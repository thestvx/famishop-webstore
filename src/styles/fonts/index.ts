import localFont from "next/font/local";

const integralCF = localFont({
  src: [
    {
      path: "./pp-monument-black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  fallback: ["system-ui", "sans-serif"],
  display: "swap",
  variable: "--font-integralCF",
});

const satoshi = localFont({
  src: [
    {
      path: "./pp-monument-regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  fallback: ["system-ui", "sans-serif"],
  display: "swap",
  variable: "--font-satoshi",
});

const thmanyahSans = localFont({
  src: [
    {
      path: "./thmanyahsans-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./thmanyahsans-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./thmanyahsans-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./thmanyahsans-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./thmanyahsans-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
  variable: "--font-thmanyah",
});

export { integralCF, satoshi, thmanyahSans };
