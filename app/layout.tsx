import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionInit } from "@/components/motion-init";
import { PreferencesProvider } from "@/components/preferences-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { SkipLink } from "@/components/skip-link";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://voidworks.eu"),
  title: { default: "Voidworks — Websites & webapplicaties", template: "%s — Voidworks" },
  description: "Voidworks ontwerpt en bouwt websites en webapplicaties die goed ogen, snel werken en makkelijk te gebruiken zijn.",
  icons: { icon: "/assets/favicon.png", shortcut: "/assets/favicon.png", apple: "/assets/favicon.png" },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Voidworks",
    title: "Voidworks — Websites & webapplicaties",
    description: "Websites en webapplicaties die goed ogen, snel werken en makkelijk te gebruiken zijn.",
    url: "https://voidworks.eu",
    images: ["/assets/voidworks-wordmark.png"],
  },
};

function validLocale(value: string | undefined | null): value is Locale {
  return value === "nl" || value === "en" || value === "de";
}

function localeFromCountry(country: string | null): Locale {
  const code = (country || "").trim().toUpperCase();
  if (code === "NL") return "nl";
  if (code === "DE") return "de";
  return "en";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("vw_locale")?.value;
  const country = requestHeaders.get("x-vercel-ip-country") || requestHeaders.get("cf-ipcountry");
  const initialLocale = validLocale(savedLocale) ? savedLocale : localeFromCountry(country);

  return <html lang={initialLocale} data-theme="dark">
    <body>
      <PreferencesProvider initialLocale={initialLocale}>
        <SkipLink />
        <SiteHeader />
        <div className="route-stage" id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter />
        <CookieConsent />
        <MotionInit />
      </PreferencesProvider>
    </body>
  </html>;
}
