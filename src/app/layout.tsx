import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { satoshi, thmanyahSans } from "@/styles/fonts";
import TopBanner from "@/components/layout/Banner/TopBanner";
import TopNavbar from "@/components/layout/Navbar/TopNavbar";
import Footer from "@/components/layout/Footer";
import HolyLoader from "holy-loader";
import Providers from "./providers";

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
              html[dir="rtl"], html[dir="rtl"] body, html[dir="rtl"] * {
                font-family: var(--font-thmanyah), Tahoma, Arial, sans-serif !important;
              }
            `,
          }}
        />
        <HolyLoader color="#868686" />
        <TopBanner />
        <Providers>
          <TopNavbar />
          {children}
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
