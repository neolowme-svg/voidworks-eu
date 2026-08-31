"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { localeMeta, type Locale } from "@/lib/i18n";
import { usePreferences } from "@/components/preferences-provider";

const DISCORD = "https://discord.gg/SBtnUvrzg6";

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, theme, setTheme, text } = usePreferences();
  const [open, setOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeRoot = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setOpen(false); setLocaleOpen(false); }, [pathname]);
  useEffect(() => {
    function close(event: MouseEvent) {
      if (!localeRoot.current?.contains(event.target as Node)) setLocaleOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const onDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const onLogin = pathname === "/login";
  const onRegister = pathname === "/register";

  const languagePicker = <div className="locale-picker" ref={localeRoot}>
    <button type="button" className="utility-button locale-trigger" aria-expanded={localeOpen} aria-label={text.nav.language} onClick={() => setLocaleOpen((value) => !value)}>
      <Image src={localeMeta[locale].flag} alt="" width={30} height={20} unoptimized />
      <span>{localeMeta[locale].short}</span><i />
    </button>
    {localeOpen && <div className="locale-menu" role="menu">
      {(Object.keys(localeMeta) as Locale[]).map((key) => <button type="button" key={key} className={key === locale ? "selected" : ""} onClick={() => { setLocale(key); setLocaleOpen(false); }}>
        <Image src={localeMeta[key].flag} alt="" width={36} height={24} unoptimized />
        <span>{localeMeta[key].label}</span>{key === locale && <b>✓</b>}
      </button>)}
    </div>}
  </div>;

  return <header className="site-header">
    <div className="container nav-shell">
      <Link href="/" className="brand" aria-label={text.nav.home}>
        <Image className="brand-dark" src="/assets/voidworks-wordmark.png" alt="Voidworks" width={1918} height={671} priority unoptimized />
        <Image className="brand-light" src="/assets/voidworks-wordmark-light.png" alt="Voidworks" width={1918} height={671} priority unoptimized />
      </Link>

      <nav className="desktop-nav" aria-label={text.nav.mainNavigation}>
        <Link href="/">{text.nav.homeLink}</Link>
        <a href="/#diensten">{text.nav.services}</a>
        <a href="/#projecten">{text.nav.projects}</a>
        <a href="/#werkwijze">{text.nav.process}</a>
        <a href="/#prijzen">{text.nav.pricing}</a>
        <a href="/#contact">{text.nav.contact}</a>
      </nav>

      <div className="nav-actions">
        {languagePicker}
        <button className="utility-button theme-toggle" type="button" aria-label={text.nav.theme} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}> 
          <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span><em>{theme === "dark" ? text.nav.dark : text.nav.light}</em>
        </button>
        <a className="discord-button" href={DISCORD} target="_blank" rel="noreferrer">Discord</a>
        {onDashboard ? <Link href="/dashboard" className="button button-primary nav-cta">{text.nav.dashboard}</Link>
          : onLogin ? <Link href="/register" className="button button-primary nav-cta">{text.nav.register}</Link>
          : onRegister ? <Link href="/login" className="button button-primary nav-cta">{text.nav.login}</Link>
          : <Link href="/login" className="button button-primary nav-cta">{text.nav.login}</Link>}
      </div>

      <button className={`menu-button ${open ? "active" : ""}`} type="button" aria-label={text.nav.menu} aria-expanded={open} onClick={() => setOpen((value) => !value)}><span /><span /><span /></button>
    </div>

    <div className={`mobile-menu ${open ? "open" : ""}`}>
      <nav className="container mobile-nav">
        <Link href="/">{text.nav.homeLink}</Link>
        <a href="/#diensten">{text.nav.services}</a><a href="/#projecten">{text.nav.projects}</a><a href="/#werkwijze">{text.nav.process}</a><a href="/#prijzen">{text.nav.pricing}</a><a href="/#contact">{text.nav.contact}</a>
        <a href={DISCORD} target="_blank" rel="noreferrer">Discord ↗</a><Link href="/login">{text.nav.login}</Link><Link href="/register">{text.nav.register}</Link>
        <div className="mobile-preferences">
          {(Object.keys(localeMeta) as Locale[]).map((key) => <button type="button" key={key} className={key === locale ? "selected" : ""} onClick={() => setLocale(key)}><Image src={localeMeta[key].flag} alt="" width={30} height={20} unoptimized />{localeMeta[key].short}</button>)}
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☾ " + text.nav.dark : "☀ " + text.nav.light}</button>
        </div>
      </nav>
    </div>
  </header>;
}
