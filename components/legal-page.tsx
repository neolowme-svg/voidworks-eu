"use client";
import { usePreferences } from "@/components/preferences-provider";

type Kind="privacy"|"terms"|"cookies"|"accessibility";
export function LegalPage({kind}:{kind:Kind}){const{text}=usePreferences();const title=text.legal[kind];const intro=kind==="privacy"?text.legal.privacyIntro:kind==="terms"?text.legal.termsIntro:kind==="cookies"?text.legal.cookieIntro:text.legal.accessibilityIntro;const sections=kind==="privacy"?text.legal.privacySections:kind==="terms"?text.legal.termsSections:kind==="cookies"?text.legal.cookieSections:text.legal.accessibilitySections;return <main className="page legal-page"><section className="section"><div className="container legal-shell"><span className="eyebrow">Voidworks</span><h1>{title}</h1><p className="legal-intro">{intro}</p><small>{text.legal.updated}</small><div className="legal-sections">{sections.map(([heading,body])=><section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div></div></section></main>}
