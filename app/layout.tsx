import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionInit } from "@/components/motion-init";

export const metadata: Metadata = {
  metadataBase: new URL("https://voidworks.eu"),
  title: {
    default: "Voidworks — Websites & webapplicaties",
    template: "%s — Voidworks",
  },
  description:
    "Voidworks ontwerpt en bouwt websites en webapplicaties die goed ogen, snel werken en makkelijk te gebruiken zijn.",
  icons: {
    icon: "/assets/favicon.png",
    shortcut: "/assets/favicon.png",
    apple: "/assets/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Voidworks",
    title: "Voidworks — Websites & webapplicaties",
    description:
      "Websites en webapplicaties die goed ogen, snel werken en makkelijk te gebruiken zijn.",
    url: "https://voidworks.eu",
    images: ["/assets/voidworks-wordmark.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>
        <SiteHeader />
        <div className="route-stage">{children}</div>
        <SiteFooter />
        <MotionInit />
      </body>
    </html>
  );
}
