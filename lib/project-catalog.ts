import type { Locale } from "@/lib/i18n";

export type PackageId = "landing" | "website" | "shop" | "platform";
export type AddonId = "hosting" | "maintenance" | "vip" | "admin" | "cms" | "priority" | "api" | "seo" | "language" | "copy";

export type PackageDefinition = {
  id: PackageId;
  slug: string;
  price: number;
  names: Record<Locale, string>;
  descriptions: Record<Locale, string>;
  features: Record<Locale, string[]>;
  popular?: boolean;
};

export type AddonDefinition = {
  id: AddonId;
  monthly?: boolean;
  included?: PackageId[];
  prices: Partial<Record<PackageId, number>>;
  names: Record<Locale, string>;
  descriptions: Record<Locale, string>;
};

export const packages: PackageDefinition[] = [
  { id:"landing", slug:"landing", price:200, names:{nl:"Landing page",en:"Landing page",de:"Landingpage"}, descriptions:{nl:"Een sterke pagina voor één dienst, campagne of product.",en:"One focused page for a service, campaign or product.",de:"Eine fokussierte Seite für eine Dienstleistung, Kampagne oder ein Produkt."}, features:{nl:["1 conversiegerichte pagina","Responsive design","Contactformulier","Technische basis-SEO","Doel: 2–4 werkdagen"],en:["1 conversion-focused page","Responsive design","Contact form","Basic technical SEO","2–4 working day target"],de:["1 Conversion-Seite","Responsive Design","Kontaktformular","Technisches Basis-SEO","Ziel: 2–4 Werktage"]} },
  { id:"website", slug:"website", price:350, popular:true, names:{nl:"Volledige website",en:"Full website",de:"Komplette Website"}, descriptions:{nl:"Een complete bedrijfswebsite met meerdere pagina's en maatwerk design.",en:"A complete business website with multiple pages and custom design.",de:"Eine vollständige Unternehmenswebsite mit mehreren Seiten und individuellem Design."}, features:{nl:["Tot 6 pagina's","Maatwerk design","Responsive bouw","Formulieren","Basis analytics"],en:["Up to 6 pages","Custom design","Responsive build","Forms","Basic analytics"],de:["Bis zu 6 Seiten","Individuelles Design","Responsive Umsetzung","Formulare","Basis-Analytics"]} },
  { id:"shop", slug:"webshop", price:425, names:{nl:"Webshop",en:"Webshop",de:"Webshop"}, descriptions:{nl:"Een compacte webshop of catalogus met productstructuur en bestel-flow.",en:"A compact webshop or catalogue with product structure and purchase flow.",de:"Ein kompakter Webshop oder Katalog mit Produktstruktur und Bestell-Flow."}, features:{nl:["Productstructuur","Shopflow","Responsive design","Payment-ready setup","Basis beheer"],en:["Product structure","Shopping flow","Responsive design","Payment-ready setup","Basic management"],de:["Produktstruktur","Shop-Flow","Responsive Design","Payment-ready Setup","Basisverwaltung"]} },
  { id:"platform", slug:"webplatform", price:500, names:{nl:"Webplatform + API",en:"Web platform + API",de:"Webplattform + API"}, descriptions:{nl:"Voor portals, dashboards en maatwerk functies met data en integraties.",en:"For portals, dashboards and custom functionality with data and integrations.",de:"Für Portale, Dashboards und individuelle Funktionen mit Daten und Integrationen."}, features:{nl:["Frontend + backend","Admin panel inbegrepen","Authenticatie","Database","API-basis"],en:["Frontend + backend","Admin panel included","Authentication","Database","API foundation"],de:["Frontend + Backend","Admin-Panel inklusive","Authentifizierung","Datenbank","API-Grundlage"]} },
];

export const addons: AddonDefinition[] = [
  { id:"hosting", monthly:true, prices:{landing:10,website:15,shop:20,platform:25}, names:{nl:"Hosting",en:"Hosting",de:"Hosting"}, descriptions:{nl:"SSL, deployment en basis uptime-monitoring.",en:"SSL, deployment and basic uptime monitoring.",de:"SSL, Deployment und grundlegendes Uptime-Monitoring."} },
  { id:"maintenance", monthly:true, prices:{landing:5,website:10,shop:15,platform:20}, names:{nl:"Onderhoud",en:"Maintenance",de:"Wartung"}, descriptions:{nl:"Updates, kleine fixes en periodieke controle.",en:"Updates, small fixes and routine checks.",de:"Updates, kleine Fixes und regelmäßige Kontrollen."} },
  { id:"vip", monthly:true, prices:{landing:10,website:12,shop:15,platform:20}, names:{nl:"VIP support",en:"VIP support",de:"VIP-Support"}, descriptions:{nl:"Voorrang bij supportvragen en kleine wijzigingen.",en:"Priority support for questions and small changes.",de:"Priorisierter Support für Fragen und kleine Änderungen."} },
  { id:"admin", prices:{landing:50,website:75,shop:90}, included:["platform"], names:{nl:"Admin panel",en:"Admin panel",de:"Admin-Panel"}, descriptions:{nl:"Beveiligde beheeromgeving voor content of data.",en:"Secure management area for content or data.",de:"Geschützter Verwaltungsbereich für Inhalte oder Daten."} },
  { id:"cms", prices:{landing:75,website:95,shop:110,platform:100}, names:{nl:"CMS",en:"CMS",de:"CMS"}, descriptions:{nl:"Zelf pagina's, secties of content beheren.",en:"Edit pages, sections or structured content yourself.",de:"Seiten, Bereiche oder Inhalte selbst verwalten."} },
  { id:"priority", prices:{landing:25,website:35,shop:45,platform:60}, names:{nl:"Priority delivery",en:"Priority delivery",de:"Priority Delivery"}, descriptions:{nl:"Voorrang in de planning wanneer capaciteit dit toelaat.",en:"Priority in planning when capacity allows it.",de:"Bevorzugte Planung, sofern Kapazität verfügbar ist."} },
  { id:"api", prices:{website:70,shop:65,platform:50}, names:{nl:"Extra API-koppeling",en:"Extra API integration",de:"Zusätzliche API"}, descriptions:{nl:"Koppel een externe dienst of databron.",en:"Connect an external service or data source.",de:"Externe Dienste oder Datenquellen anbinden."} },
  { id:"seo", prices:{website:55,shop:70,platform:70}, names:{nl:"SEO launch pack",en:"SEO launch pack",de:"SEO Launch Pack"}, descriptions:{nl:"Metadata, sitemap, redirects en launch-check.",en:"Metadata, sitemap, redirects and launch review.",de:"Metadaten, Sitemap, Redirects und Launch-Check."} },
  { id:"language", prices:{landing:5,website:5,shop:5,platform:5}, names:{nl:"Extra taal",en:"Extra language",de:"Zusätzliche Sprache"}, descriptions:{nl:"Voeg één extra vertaalde taalversie toe. €5 per extra taal.",en:"Add one additional translated language version. €5 per extra language.",de:"Eine weitere übersetzte Sprachversion ergänzen. 5 € pro zusätzlicher Sprache."} },
  { id:"copy", prices:{landing:35,website:55,shop:70,platform:80}, names:{nl:"Copywriting hulp",en:"Copywriting help",de:"Copywriting-Hilfe"}, descriptions:{nl:"Hulp bij structuur, headings en conversietekst.",en:"Help with structure, headlines and conversion copy.",de:"Hilfe bei Struktur, Headlines und Conversion-Texten."} },
];

export function getPackageBySlug(slug: string | undefined) {
  return packages.find((item) => item.slug === slug || item.id === slug) ?? null;
}

export function availableAddons(packageId: PackageId) {
  return addons.filter((item) => item.prices[packageId] !== undefined || item.included?.includes(packageId));
}

export function calculateProjectPrice(packageId: PackageId, addonIds: string[]) {
  const pack = packages.find((item) => item.id === packageId);
  if (!pack) return { once:0, monthly:0 };
  const selected = availableAddons(packageId).filter((item) => addonIds.includes(item.id) && !item.included?.includes(packageId));
  return {
    once: pack.price + selected.filter((item) => !item.monthly).reduce((sum,item)=>sum+(item.prices[packageId] ?? 0),0),
    monthly: selected.filter((item) => item.monthly).reduce((sum,item)=>sum+(item.prices[packageId] ?? 0),0),
  };
}
