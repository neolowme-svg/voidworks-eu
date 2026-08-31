"use client";

import Image from "next/image";
import Link from "next/link";
import { usePreferences } from "@/components/preferences-provider";

export function SiteFooter(){const{text}=usePreferences();return <footer className="site-footer"><div className="container footer-grid">
  <div className="footer-brand"><Image className="brand-dark" src="/assets/voidworks-wordmark.png" alt="Voidworks" width={1918} height={671} unoptimized/><Image className="brand-light" src="/assets/voidworks-wordmark-light.png" alt="Voidworks" width={1918} height={671} unoptimized/><p>{text.footer.text}</p></div>
  <div className="footer-column"><strong>Voidworks</strong><Link href="/#diensten">{text.nav.services}</Link><Link href="/#projecten">{text.nav.projects}</Link><Link href="/#werkwijze">{text.nav.process}</Link><Link href="/#prijzen">{text.nav.pricing}</Link><Link href="/#contact">{text.nav.contact}</Link></div>
  <div className="footer-column"><strong>{text.footer.account}</strong><Link href="/login">{text.nav.login}</Link><Link href="/register">{text.nav.register}</Link><Link href="/dashboard">{text.nav.dashboard}</Link><Link href="/account/settings">{text.dashboard.account}</Link><Link href="/forgot-password">{text.auth.forgot}</Link><a href="https://discord.gg/SBtnUvrzg6" target="_blank" rel="noreferrer">{text.footer.discord} ↗</a></div>
  <div className="footer-column"><strong>{text.footer.legal}</strong><Link href="/privacy">{text.legal.privacy}</Link><Link href="/terms">{text.legal.terms}</Link><Link href="/cookies">{text.legal.cookies}</Link><Link href="/accessibility">{text.legal.accessibility}</Link><button className="footer-link-button" type="button" onClick={()=>window.dispatchEvent(new Event("voidworks-cookie-settings"))}>{text.cookie.settings}</button></div>
  <div className="footer-column"><strong>{text.footer.contact}</strong><a href="mailto:info@voidworks.eu">info@voidworks.eu</a><a href="https://fentexrp.nl/" target="_blank" rel="noreferrer">Fentex ↗</a><a href="https://www.flexwrap.com/" target="_blank" rel="noreferrer">Flexwrap ↗</a></div>
</div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Voidworks</span><span>voidworks.eu</span></div></footer>}
