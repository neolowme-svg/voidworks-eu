"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { copy, type Locale, type Theme } from "@/lib/i18n";

type Preferences = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  text: (typeof copy)[Locale];
};

const Context = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("nl");
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const storedLocale = localStorage.getItem("voidworks-locale") as Locale | null;
    const storedTheme = localStorage.getItem("voidworks-theme") as Theme | null;
    if (storedLocale && ["nl", "en", "de"].includes(storedLocale)) setLocaleState(storedLocale);
    if (storedTheme && ["dark", "light"].includes(storedTheme)) setThemeState(storedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("voidworks-locale", locale);
    localStorage.setItem("voidworks-theme", theme);
  }, [locale, theme]);

  const value = useMemo<Preferences>(() => ({
    locale,
    setLocale: (next) => setLocaleState(next),
    theme,
    setTheme: (next) => setThemeState(next),
    text: copy[locale],
  }), [locale, theme]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error("usePreferences must be used inside PreferencesProvider");
  return context;
}
