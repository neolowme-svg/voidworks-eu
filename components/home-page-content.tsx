"use client";

import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { PricingConfigurator } from "@/components/pricing-configurator";
import { usePreferences } from "@/components/preferences-provider";

export function HomePageContent() {
  const { text } = usePreferences();
  return <main className="page page-home" id="top">
    <section className="hero hero-centered"><div className="container hero-inner" data-reveal>
      <Image className="hero-mark" src="/assets/voidworks-mark.png" alt="" width={96} height={96} priority unoptimized />
      <h1>{text.hero.title1}<br />{text.hero.title2}</h1><p>{text.hero.text}</p>
      <div className="hero-actions"><Link className="button button-primary" href="/#contact">{text.hero.start}</Link><Link className="button button-secondary" href="/#projecten">{text.hero.projects}</Link></div>
      <div className="hero-proof"><span>2–4</span><div><strong>{text.hero.speed}</strong><small>{text.hero.ai}</small></div></div>
    </div></section>

    <section className="section section-border" id="diensten"><div className="container">
      <div className="section-kicker" data-reveal><span>{text.services.kicker}</span></div>
      <div className="section-heading compact-heading" data-reveal><div><h2>{text.services.title}</h2></div><p>{text.services.intro}</p></div>
      <div className="service-grid">{text.services.items.map(([title, body], index) => <article className="service-card" key={title} data-reveal><span className="card-number">0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    </div></section>

    <section className="section projects-section" id="projecten"><div className="container">
      <div className="section-kicker" data-reveal><span>{text.projects.kicker}</span></div>
      <div className="section-heading compact-heading" data-reveal><div><h2>{text.projects.title}</h2></div><p>{text.projects.intro}</p></div>
      <div className="project-grid">
        <article className="project-card" data-reveal><a className="project-shot" href="https://fentexrp.nl/" target="_blank" rel="noreferrer"><Image src="/assets/projects/fentex-home.png" alt="Fentex Roleplay" width={1899} height={907} sizes="(max-width: 900px) 100vw, 50vw" unoptimized /></a><div className="project-copy"><div><span>{text.projects.community}</span><h3>Fentex Roleplay</h3><p>{text.projects.fentex}</p></div><a href="https://fentexrp.nl/" target="_blank" rel="noreferrer">{text.projects.view}</a></div></article>
        <article className="project-card" data-reveal><a className="project-shot" href="https://www.flexwrap.com/" target="_blank" rel="noreferrer"><Image src="/assets/projects/flexwrap-home.png" alt="Flexwrap" width={1901} height={908} sizes="(max-width: 900px) 100vw, 50vw" unoptimized /></a><div className="project-copy"><div><span>{text.projects.business}</span><h3>Flexwrap</h3><p>{text.projects.flexwrap}</p></div><a href="https://www.flexwrap.com/" target="_blank" rel="noreferrer">{text.projects.view}</a></div></article>
      </div>
    </div></section>

    <section className="section section-border" id="werkwijze"><div className="container process-layout">
      <div className="process-intro" data-reveal><span className="eyebrow">{text.process.kicker}</span><h2>{text.process.title}</h2><p>{text.process.intro}</p></div>
      <div className="process-list">{text.process.items.map(([number, title, body]) => <article key={title} data-reveal><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
    </div></section>

    <section className="section section-border pricing-section" id="prijzen"><div className="container">
      <div className="section-kicker" data-reveal><span>{text.pricing.kicker}</span></div>
      <div className="section-heading compact-heading" data-reveal><div><h2>{text.pricing.title}</h2></div><p>{text.pricing.intro}</p></div><PricingConfigurator />
    </div></section>

    <section className="section contact-section" id="contact"><div className="container contact-grid">
      <div className="contact-copy" data-reveal><span className="eyebrow">{text.contact.kicker}</span><h2>{text.contact.title}</h2><p>{text.contact.intro}</p><a href="mailto:info@voidworks.eu">info@voidworks.eu</a></div><div data-reveal><ContactForm /></div>
    </div></section>
  </main>;
}
