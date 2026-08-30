"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { copy, type Locale, type Theme } from "@/lib/i18n";

export type Consent = "unset" | "essential" | "preferences";
type Preferences = { locale:Locale; setLocale:(locale:Locale)=>void; theme:Theme; setTheme:(theme:Theme)=>void; consent:Consent; setConsent:(value:Exclude<Consent,"unset">)=>void; text:(typeof copy)[Locale] };
const Context = createContext<Preferences | null>(null);
const CONSENT_VERSION = "3";

export function PreferencesProvider({ children, initialLocale = "en" }: { children:React.ReactNode; initialLocale?:Locale }) {
  const [locale,setLocaleState]=useState<Locale>(initialLocale);
  const [theme,setThemeState]=useState<Theme>("dark");
  const [consent,setConsentState]=useState<Consent>("unset");

  useEffect(()=>{
    const storedVersion=localStorage.getItem("voidworks-consent-version");
    const storedConsent=localStorage.getItem("voidworks-consent") as Consent|null;
    if(storedVersion!==CONSENT_VERSION){
      localStorage.removeItem("voidworks-consent");
      localStorage.removeItem("voidworks-locale");
      localStorage.removeItem("voidworks-theme");
      return;
    }
    if(storedConsent==="essential"||storedConsent==="preferences")setConsentState(storedConsent);
    if(storedConsent==="preferences"){
      const storedLocale=localStorage.getItem("voidworks-locale") as Locale|null;
      const storedTheme=localStorage.getItem("voidworks-theme") as Theme|null;
      if(storedLocale&&["nl","en","de"].includes(storedLocale))setLocaleState(storedLocale);
      if(storedTheme&&["dark","light"].includes(storedTheme))setThemeState(storedTheme);
    }
  },[]);

  useEffect(()=>{
    document.documentElement.lang=locale;
    document.documentElement.dataset.theme=theme;
    if(consent==="preferences"){
      localStorage.setItem("voidworks-locale",locale);
      localStorage.setItem("voidworks-theme",theme);
    }
  },[locale,theme,consent]);

  const setConsent=(value:Exclude<Consent,"unset">)=>{
    setConsentState(value);
    localStorage.setItem("voidworks-consent",value);
    localStorage.setItem("voidworks-consent-version",CONSENT_VERSION);
    if(value==="essential"){
      localStorage.removeItem("voidworks-locale");
      localStorage.removeItem("voidworks-theme");
    } else {
      localStorage.setItem("voidworks-locale",locale);
      localStorage.setItem("voidworks-theme",theme);
    }
  };

  const value=useMemo<Preferences>(()=>({locale,setLocale:setLocaleState,theme,setTheme:setThemeState,consent,setConsent,text:copy[locale]}),[locale,theme,consent]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePreferences(){const context=useContext(Context);if(!context)throw new Error("usePreferences must be used inside PreferencesProvider");return context;}
