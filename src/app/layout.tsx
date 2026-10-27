import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { satoshi, thmanyahSans } from "@/styles/fonts";
import TopBanner from "@/components/layout/Banner/TopBanner";
import TopNavbar from "@/components/layout/Navbar/TopNavbar";
import Footer from "@/components/layout/Footer";
import HolyLoader from "holy-loader";
import Providers from "./providers";
import RegionModal from "@/components/common/RegionModal";
import PixelPreloader from "@/components/common/PixelPreloader";

export const metadata: Metadata = {
  title: "Famishop",
  description: "Famishop webstore",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${satoshi.className}`} suppressHydrationWarning>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-thmanyah: ${thmanyahSans.style.fontFamily};
              }
              html[dir="rtl"] body,
              html[dir="rtl"] button,
              html[dir="rtl"] input,
              html[dir="rtl"] select,
              html[dir="rtl"] textarea,
              html[dir="rtl"] a,
              html[dir="rtl"] p,
              html[dir="rtl"] span,
              html[dir="rtl"] h1,
              html[dir="rtl"] h2,
              html[dir="rtl"] h3,
              html[dir="rtl"] h4,
              html[dir="rtl"] h5,
              html[dir="rtl"] h6,
              html[dir="rtl"] li,
              html[dir="rtl"] label {
                font-family: var(--font-thmanyah), Tahoma, Arial, sans-serif !important;
              }
              html[dir="rtl"] h1,
              html[dir="rtl"] h2,
              html[dir="rtl"] h3,
              html[dir="rtl"] .font-black,
              html[dir="rtl"] .font-extrabold {
                font-weight: 900 !important;
              }
            `,
          }}
        />
        <HolyLoader color="#868686" />
        <Providers>
          <PixelPreloader />
          <TopBanner />
          <RegionModal />
          <TopNavbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
