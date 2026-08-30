"use client";

import { useMemo, useState } from "react";

type Package = {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
};

type Addon = { id: string; name: string; price: number; monthly?: boolean; description: string };

const packages: Package[] = [
  { id: "landing", name: "Landing page", price: 749, description: "Voor één duidelijke campagne, dienst of product.", features: ["1 krachtige pagina", "Responsive design", "Contactformulier", "Basis SEO", "Analytics-ready"] },
  { id: "business", name: "Volledige website", price: 1499, description: "Voor bedrijven die meerdere diensten en pagina's nodig hebben.", features: ["Tot 8 pagina's", "Maatwerk design", "CMS-contentstructuur", "Formulieren", "Technische SEO"], popular: true },
  { id: "admin", name: "Website + admin panel", price: 2499, description: "Website met beveiligde klant- of beheeromgeving.", features: ["Alles van Volledige website", "Login / accounts", "Admin dashboard", "Database", "Rollen & rechten"] },
  { id: "platform", name: "Webplatform + API", price: 4499, description: "Voor maatwerk software, portals en koppelingen.", features: ["Frontend + backend", "Admin panel", "API-koppelingen", "Database & auth", "Deployment & monitoring"] },
];

const addons: Addon[] = [
  { id: "hosting", name: "Hosting & monitoring", price: 19, monthly: true, description: "Hosting, SSL, uptime en basis monitoring." },
  { id: "maintenance", name: "Onderhoud", price: 69, monthly: true, description: "Updates, kleine fixes en maandelijkse controle." },
  { id: "vip", name: "VIP support", price: 149, monthly: true, description: "Prioriteit bij support en kleine wijzigingen." },
  { id: "extra-admin", name: "Extra admin panel", price: 750, description: "Extra beheeromgeving of aparte rol-interface." },
  { id: "api", name: "Extra API-koppeling", price: 450, description: "Koppeling met externe software of databron." },
  { id: "cms", name: "Uitgebreid CMS", price: 350, description: "Zelf pagina's, nieuws of content beheren." },
  { id: "seo", name: "SEO launch pack", price: 299, description: "Metadata, sitemap, redirects en launch-check." },
  { id: "priority", name: "Priority delivery", price: 499, description: "Versnelde planning waar capaciteit dit toelaat." },
];

function euros(value: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function PricingConfigurator() {
  const [selectedPackage, setSelectedPackage] = useState(packages[1].id);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const pack = packages.find((item) => item.id === selectedPackage) ?? packages[1];
  const chosen = addons.filter((item) => selectedAddons.includes(item.id));
  const totals = useMemo(() => ({
    once: pack.price + chosen.filter((item) => !item.monthly).reduce((sum, item) => sum + item.price, 0),
    monthly: chosen.filter((item) => item.monthly).reduce((sum, item) => sum + item.price, 0),
  }), [pack, selectedAddons]);

  function toggleAddon(id: string) {
    setSelectedAddons((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function requestQuote() {
    const detail = {
      packageName: pack.name,
      addons: chosen.map((item) => item.name),
      once: totals.once,
      monthly: totals.monthly,
    };
    window.dispatchEvent(new CustomEvent("voidworks-pricing-selection", { detail }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pricing-configurator" data-reveal>
      <div className="pricing-packages">
        {packages.map((item) => (
          <button key={item.id} type="button" className={`pricing-card ${selectedPackage === item.id ? "selected" : ""}`} onClick={() => setSelectedPackage(item.id)}>
            <span className="pricing-card-top"><span>{item.name}</span>{item.popular && <em>Meest gekozen</em>}</span>
            <strong>Vanaf {euros(item.price)}</strong>
            <p>{item.description}</p>
            <ul>{item.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
            <span className="pricing-select">{selectedPackage === item.id ? "Geselecteerd" : "Kies pakket"}</span>
          </button>
        ))}
      </div>

      <div className="addon-panel">
        <div className="addon-heading"><div><span className="eyebrow">Extra opties</span><h3>Maak je pakket compleet.</h3></div><p>Vink alleen aan wat je nodig hebt. De prijsindicatie verandert direct.</p></div>
        <div className="addon-grid">
          {addons.map((addon) => {
            const checked = selectedAddons.includes(addon.id);
            return <label className={`addon-option ${checked ? "checked" : ""}`} key={addon.id}>
              <input type="checkbox" checked={checked} onChange={() => toggleAddon(addon.id)} />
              <span className="addon-check">{checked ? "✓" : ""}</span>
              <span className="addon-copy"><strong>{addon.name}</strong><small>{addon.description}</small></span>
              <b>{addon.monthly ? `+ ${euros(addon.price)}/mnd` : `+ ${euros(addon.price)}`}</b>
            </label>;
          })}
        </div>

        <div className="pricing-summary">
          <div><span>Eenmalige indicatie</span><strong>{euros(totals.once)}</strong></div>
          <div><span>Maandelijks</span><strong>{totals.monthly ? `${euros(totals.monthly)}/mnd` : "€ 0/mnd"}</strong></div>
          <button className="button button-primary" type="button" onClick={requestQuote}>Prijsaanvraag starten</button>
        </div>
        <p className="pricing-note">Indicatieve vanafprijzen excl. btw. Definitieve prijs volgt na scope en technische check.</p>
      </div>
    </div>
  );
}
