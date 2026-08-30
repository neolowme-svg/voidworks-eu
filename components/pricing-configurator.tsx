"use client";

import { useMemo, useState } from "react";
import { usePreferences } from "@/components/preferences-provider";

type PackageId = "landing" | "website" | "shop" | "platform";
type AddonId = "hosting" | "maintenance" | "vip" | "admin" | "cms" | "priority" | "api" | "seo" | "language" | "copy";
type Package = { id: PackageId; name: string; price: number; description: string; features: string[]; popular?: boolean };
type Addon = { id: AddonId; name: string; description: string; monthly?: boolean; prices: Partial<Record<PackageId, number>>; included?: PackageId[] };

export function PricingConfigurator() {
  const { locale, text } = usePreferences();
  const [selectedPackage, setSelectedPackage] = useState<PackageId>("website");
  const [selectedAddons, setSelectedAddons] = useState<AddonId[]>([]);

  const packages: Package[] = locale === "en" ? [
    { id:"landing", name:"Landing page", price:200, description:"A focused page for one service, campaign or product.", features:["1 conversion-focused page","Responsive design","Contact form","Basic technical SEO","2–4 working day target"] },
    { id:"website", name:"Full website", price:350, description:"A complete business website with multiple pages and a custom visual style.", features:["Up to 6 pages","Custom design","Responsive build","Forms","Basic analytics"], popular:true },
    { id:"shop", name:"Webshop", price:425, description:"A compact webshop or catalogue with product structure and conversion flow.", features:["Product structure","Shopping flow","Responsive design","Payment-ready setup","Basic management"] },
    { id:"platform", name:"Web platform + API", price:500, description:"For portals, dashboards and custom functionality with data and integrations.", features:["Frontend + backend","Admin panel included","Authentication","Database","API foundation"] },
  ] : locale === "de" ? [
    { id:"landing", name:"Landingpage", price:200, description:"Eine fokussierte Seite für eine Dienstleistung, Kampagne oder ein Produkt.", features:["1 Conversion-Seite","Responsive Design","Kontaktformular","Technisches Basis-SEO","Ziel: 2–4 Werktage"] },
    { id:"website", name:"Komplette Website", price:350, description:"Eine vollständige Unternehmenswebsite mit mehreren Seiten und individuellem Design.", features:["Bis zu 6 Seiten","Individuelles Design","Responsive Umsetzung","Formulare","Basis-Analytics"], popular:true },
    { id:"shop", name:"Webshop", price:425, description:"Ein kompakter Webshop oder Katalog mit Produktstruktur und Conversion-Flow.", features:["Produktstruktur","Shop-Flow","Responsive Design","Payment-ready Setup","Basisverwaltung"] },
    { id:"platform", name:"Webplattform + API", price:500, description:"Für Portale, Dashboards und individuelle Funktionen mit Daten und Integrationen.", features:["Frontend + Backend","Admin-Panel inklusive","Authentifizierung","Datenbank","API-Grundlage"] },
  ] : [
    { id:"landing", name:"Landing page", price:200, description:"Voor één dienst, campagne of product met een duidelijke conversiefocus.", features:["1 sterke pagina","Responsive design","Contactformulier","Technische basis-SEO","Doel: 2–4 werkdagen"] },
    { id:"website", name:"Volledige website", price:350, description:"Een complete bedrijfswebsite met meerdere pagina's en een eigen visuele stijl.", features:["Tot 6 pagina's","Maatwerk design","Responsive bouw","Formulieren","Basis analytics"], popular:true },
    { id:"shop", name:"Webshop", price:425, description:"Een compacte webshop of catalogus met productstructuur en conversieflow.", features:["Productstructuur","Shopflow","Responsive design","Payment-ready setup","Basis beheer"] },
    { id:"platform", name:"Webplatform + API", price:500, description:"Voor portals, dashboards en maatwerk functies met data en koppelingen.", features:["Frontend + backend","Admin panel inbegrepen","Authenticatie","Database","API-basis"] },
  ];

  const addons: Addon[] = locale === "en" ? [
    { id:"hosting", name:"Hosting", description:"SSL, deployment and basic uptime monitoring.", monthly:true, prices:{ landing:10, website:15, shop:20, platform:25 } },
    { id:"maintenance", name:"Maintenance", description:"Updates, small fixes and routine checks.", monthly:true, prices:{ landing:5, website:10, shop:15, platform:20 } },
    { id:"vip", name:"VIP support", description:"Priority support for questions and small changes.", monthly:true, prices:{ landing:10, website:12, shop:15, platform:20 } },
    { id:"admin", name:"Admin panel", description:"Secure management area for content or data.", prices:{ landing:50, website:75, shop:90 }, included:["platform"] },
    { id:"cms", name:"CMS", description:"Edit pages, sections or structured content yourself.", prices:{ landing:75, website:95, shop:110, platform:100 } },
    { id:"priority", name:"Priority delivery", description:"Priority in planning when capacity allows it.", prices:{ landing:25, website:35, shop:45, platform:60 } },
    { id:"api", name:"Extra API integration", description:"Connect an external service or data source.", prices:{ website:70, shop:65, platform:50 } },
    { id:"seo", name:"SEO launch pack", description:"Extended metadata, sitemap, redirects and launch review.", prices:{ website:55, shop:70, platform:70 } },
    { id:"language", name:"Extra language", description:"Add one additional translated language version.", prices:{ landing:30, website:45, shop:60, platform:70 } },
    { id:"copy", name:"Copywriting help", description:"Improve structure, headlines and key conversion copy.", prices:{ landing:35, website:55, shop:70, platform:80 } },
  ] : locale === "de" ? [
    { id:"hosting", name:"Hosting", description:"SSL, Deployment und grundlegendes Uptime-Monitoring.", monthly:true, prices:{ landing:10, website:15, shop:20, platform:25 } },
    { id:"maintenance", name:"Wartung", description:"Updates, kleine Fixes und regelmäßige Kontrollen.", monthly:true, prices:{ landing:5, website:10, shop:15, platform:20 } },
    { id:"vip", name:"VIP-Support", description:"Priorisierter Support für Fragen und kleine Änderungen.", monthly:true, prices:{ landing:10, website:12, shop:15, platform:20 } },
    { id:"admin", name:"Admin-Panel", description:"Geschützter Verwaltungsbereich für Inhalte oder Daten.", prices:{ landing:50, website:75, shop:90 }, included:["platform"] },
    { id:"cms", name:"CMS", description:"Seiten, Bereiche oder strukturierte Inhalte selbst verwalten.", prices:{ landing:75, website:95, shop:110, platform:100 } },
    { id:"priority", name:"Priority Delivery", description:"Bevorzugte Planung, sofern Kapazität verfügbar ist.", prices:{ landing:25, website:35, shop:45, platform:60 } },
    { id:"api", name:"Zusätzliche API", description:"Externe Dienste oder Datenquellen anbinden.", prices:{ website:70, shop:65, platform:50 } },
    { id:"seo", name:"SEO Launch Pack", description:"Erweiterte Metadaten, Sitemap, Redirects und Launch-Check.", prices:{ website:55, shop:70, platform:70 } },
    { id:"language", name:"Zusätzliche Sprache", description:"Eine weitere übersetzte Sprachversion ergänzen.", prices:{ landing:30, website:45, shop:60, platform:70 } },
    { id:"copy", name:"Copywriting-Hilfe", description:"Struktur, Headlines und Conversion-Texte verbessern.", prices:{ landing:35, website:55, shop:70, platform:80 } },
  ] : [
    { id:"hosting", name:"Hosting", description:"SSL, deployment en basis uptime-monitoring.", monthly:true, prices:{ landing:10, website:15, shop:20, platform:25 } },
    { id:"maintenance", name:"Onderhoud", description:"Updates, kleine fixes en periodieke controle.", monthly:true, prices:{ landing:5, website:10, shop:15, platform:20 } },
    { id:"vip", name:"VIP support", description:"Voorrang bij supportvragen en kleine wijzigingen.", monthly:true, prices:{ landing:10, website:12, shop:15, platform:20 } },
    { id:"admin", name:"Admin panel", description:"Beveiligde beheeromgeving voor content of data.", prices:{ landing:50, website:75, shop:90 }, included:["platform"] },
    { id:"cms", name:"CMS", description:"Zelf pagina's, secties of gestructureerde content beheren.", prices:{ landing:75, website:95, shop:110, platform:100 } },
    { id:"priority", name:"Priority delivery", description:"Voorrang in de planning wanneer capaciteit dit toelaat.", prices:{ landing:25, website:35, shop:45, platform:60 } },
    { id:"api", name:"Extra API-koppeling", description:"Koppel een externe dienst of databron aan je project.", prices:{ website:70, shop:65, platform:50 } },
    { id:"seo", name:"SEO launch pack", description:"Uitgebreide metadata, sitemap, redirects en launch-check.", prices:{ website:55, shop:70, platform:70 } },
    { id:"language", name:"Extra taal", description:"Voeg één extra vertaalde taalversie toe.", prices:{ landing:30, website:45, shop:60, platform:70 } },
    { id:"copy", name:"Copywriting hulp", description:"Structuur, headings en belangrijke conversieteksten verbeteren.", prices:{ landing:35, website:55, shop:70, platform:80 } },
  ];

  const pack = packages.find((item) => item.id === selectedPackage) ?? packages[1];
  const chosen = addons.filter((item) => selectedAddons.includes(item.id) && item.prices[selectedPackage] !== undefined && !(item.included ?? []).includes(selectedPackage));
  const totals = useMemo(() => ({
    once: pack.price + chosen.filter((item) => !item.monthly).reduce((sum, item) => sum + (item.prices[selectedPackage] ?? 0), 0),
    monthly: chosen.filter((item) => item.monthly).reduce((sum, item) => sum + (item.prices[selectedPackage] ?? 0), 0),
  }), [pack, chosen, selectedPackage]);

  function euros(value: number) { return new Intl.NumberFormat(locale === "en" ? "en-IE" : locale === "de" ? "de-DE" : "nl-NL", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(value); }
  function choosePackage(id: PackageId) { setSelectedPackage(id); setSelectedAddons((current) => current.filter((addonId) => addons.find((addon) => addon.id === addonId)?.prices[id] !== undefined)); }
  function toggleAddon(id: AddonId) { const addon = addons.find((item) => item.id === id); if (!addon || addon.prices[selectedPackage] === undefined || addon.included?.includes(selectedPackage)) return; setSelectedAddons((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function requestQuote() {
    const detail = { packageName: pack.name, addons: chosen.map((item) => item.name), once: totals.once, monthly: totals.monthly };
    window.dispatchEvent(new CustomEvent("voidworks-pricing-selection", { detail }));
    document.getElementById("contact")?.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  return <div className="pricing-configurator" data-reveal>
    <div className="pricing-packages">{packages.map((item) => <button key={item.id} type="button" className={`pricing-card ${selectedPackage === item.id ? "selected" : ""}`} onClick={() => choosePackage(item.id)}>
      <span className="pricing-card-top"><span>{item.name}</span>{item.popular && <em>{text.pricing.popular}</em>}</span><strong>{text.pricing.from} {euros(item.price)}</strong><p>{item.description}</p><ul>{item.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><span className="pricing-select">{selectedPackage === item.id ? text.pricing.selected : text.pricing.choose}</span>
    </button>)}</div>

    <div className="addon-panel"><div className="addon-heading"><div><span className="eyebrow">{text.pricing.extras}</span><h3>{text.pricing.complete}</h3></div><p>{text.pricing.completeText}</p></div>
      <div className="addon-grid">{addons.map((addon) => {
        const included = addon.included?.includes(selectedPackage) ?? false;
        const price = addon.prices[selectedPackage];
        const disabled = price === undefined && !included;
        const checked = included || selectedAddons.includes(addon.id);
        return <button className={`addon-option ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} ${included ? "included" : ""}`} key={addon.id} type="button" onClick={() => toggleAddon(addon.id)} disabled={disabled || included}>
          <span className="addon-check">{checked ? "✓" : ""}</span><span className="addon-copy"><strong>{addon.name}</strong><small>{addon.description}</small></span>
          <b>{included ? text.pricing.included : disabled ? text.pricing.unavailable : `${addon.monthly ? "+ " : "+ "}${euros(price ?? 0)}${addon.monthly ? text.pricing.perMonth : ""}`}</b>
        </button>;
      })}</div>
      <div className="pricing-summary"><div><span>{text.pricing.once}</span><strong>{euros(totals.once)}</strong></div><div><span>{text.pricing.monthly}</span><strong>{totals.monthly ? `${euros(totals.monthly)}${text.pricing.perMonth}` : `${euros(0)}${text.pricing.perMonth}`}</strong></div><button className="button button-primary" type="button" onClick={requestQuote}>{text.pricing.request}</button></div>
      <p className="pricing-note">{text.pricing.note}</p>
    </div>
  </div>;
}
