"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { copy, type Locale, type Theme } from "@/lib/i18n";

export type Consent = "unset" | "essential" | "preferences";
type Preferences = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  consent: Consent;
  setConsent: (value: Exclude<Consent, "unset">) => void;
  text: (typeof copy)[Locale];
};

const Context = createContext<Preferences | null>(null);
const CONSENT_VERSION = "4";
const YEAR = 60 * 60 * 24 * 365;

function writeLocaleCookie(locale: Locale) {
  document.cookie = `vw_locale=${locale}; Max-Age=${YEAR}; Path=/; SameSite=Lax; Secure`;
}

export function PreferencesProvider({ children, initialLocale = "en" }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [consent, setConsentState] = useState<Consent>("unset");

  useEffect(() => {
    const storedVersion = localStorage.getItem("voidworks-consent-version");
    const storedConsent = localStorage.getItem("voidworks-consent") as Consent | null;

    if (storedVersion === CONSENT_VERSION && (storedConsent === "essential" || storedConsent === "preferences")) {
      setConsentState(storedConsent);
    }

    // Language is an explicit functional preference and is persisted independently
    // so navigation never unexpectedly changes the selected language.
    const storedLocale = localStorage.getItem("voidworks-locale") as Locale | null;
    if (storedLocale && ["nl", "en", "de"].includes(storedLocale)) {
      setLocaleState(storedLocale);
      writeLocaleCookie(storedLocale);
    }

    if (storedVersion === CONSENT_VERSION && storedConsent === "preferences") {
      const storedTheme = localStorage.getItem("voidworks-theme") as Theme | null;
      if (storedTheme && ["dark", "light"].includes(storedTheme)) setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
  }, [locale, theme]);

  const setLocale = (value: Locale) => {
    setLocaleState(value);
    localStorage.setItem("voidworks-locale", value);
    writeLocaleCookie(value);
  };

  const setTheme = (value: Theme) => {
    setThemeState(value);
    if (consent === "preferences") localStorage.setItem("voidworks-theme", value);
  };

  const setConsent = (value: Exclude<Consent, "unset">) => {
    setConsentState(value);
    localStorage.setItem("voidworks-consent", value);
    localStorage.setItem("voidworks-consent-version", CONSENT_VERSION);
    if (value === "essential") {
      localStorage.removeItem("voidworks-theme");
    } else {
      localStorage.setItem("voidworks-theme", theme);
    }
  };

  const value = useMemo<Preferences>(() => ({ locale, setLocale, theme, setTheme, consent, setConsent, text: copy[locale] }), [locale, theme, consent]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error("usePreferences must be used inside PreferencesProvider");
  return context;
}
