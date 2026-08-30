import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";

const services = [
  ["Websites", "Snelle websites op maat met een sterke visuele stijl en een duidelijke focus op conversie."],
  ["Webapplicaties", "Dashboards, klantportalen en maatwerk functies wanneer een normale website niet genoeg is."],
  ["Redesign", "Bestaande websites opnieuw ontworpen en gebouwd zonder de uitstraling van een standaard template."],
  ["Hosting & onderhoud", "Deployments, updates en wijzigingen blijven geregeld nadat je website live staat."],
];

const steps = [
  ["01", "Bespreken", "We bepalen wat de website moet doen, voor wie hij is en welke uitstraling daarbij past."],
  ["02", "Ontwerpen", "We zetten structuur, typografie, kleuren en interacties neer voordat de bouw begint."],
  ["03", "Bouwen", "De website wordt responsive gebouwd en getest op desktop, tablet en mobiel."],
  ["04", "Live", "Na de laatste feedback koppelen we je domein en zetten we de productieversie live."],
];

export default function HomePage() {
  return (
    <main className="page page-home" id="top">
      <section className="hero hero-centered">
        <div className="container hero-inner" data-reveal>
          <Image className="hero-mark" src="/assets/voidworks-mark.png" alt="" width={96} height={96} priority />
          <h1>Websites die je merk<br />serieus laten voelen.</h1>
          <p>Design, development en onderhoud in één lijn. Donker, strak en gebouwd om snel en duidelijk te werken.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/#contact">Project starten</Link>
            <Link className="button button-secondary" href="/#projecten">Bekijk projecten</Link>
          </div>
        </div>
      </section>

      <section className="section section-border" id="diensten">
        <div className="container">
          <div className="section-kicker" data-reveal><span>Diensten</span></div>
          <div className="section-heading compact-heading" data-reveal>
            <div><h2>Wat we bouwen.</h2></div>
            <p>Geen overvolle templates. Alleen een sterke basis, goede details en functies die echt nodig zijn.</p>
          </div>
          <div className="service-grid">
            {services.map(([title, text], index) => (
              <article className="service-card" key={title} data-reveal>
                <span className="card-number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section projects-section" id="projecten">
        <div className="container">
          <div className="section-kicker" data-reveal><span>Projecten</span></div>
          <div className="section-heading compact-heading" data-reveal>
            <div><h2>Recent werk.</h2></div>
            <p>Verschillende merken met ieder een eigen stijl, structuur en doel.</p>
          </div>
          <div className="project-grid">
            <article className="project-card" data-reveal>
              <a className="project-shot" href="https://fentexrp.nl/" target="_blank" rel="noreferrer">
                <Image src="/assets/projects/fentex-home.png" alt="Homepage van Fentex Roleplay" width={1899} height={907} sizes="(max-width: 900px) 100vw, 50vw" />
              </a>
              <div className="project-copy">
                <div><span>Community website</span><h3>Fentex Roleplay</h3><p>Een duidelijke community-site met focus op navigatie, informatie en conversie.</p></div>
                <a href="https://fentexrp.nl/" target="_blank" rel="noreferrer">Bekijk site ↗</a>
              </div>
            </article>
            <article className="project-card" data-reveal>
              <a className="project-shot" href="https://www.flexwrap.com/" target="_blank" rel="noreferrer">
                <Image src="/assets/projects/flexwrap-home.png" alt="Homepage van Flexwrap" width={1901} height={908} sizes="(max-width: 900px) 100vw, 50vw" />
              </a>
              <div className="project-copy">
                <div><span>Bedrijfswebsite</span><h3>Flexwrap</h3><p>Een zakelijke website met een eigen identiteit, heldere structuur en sterke mobiele ervaring.</p></div>
                <a href="https://www.flexwrap.com/" target="_blank" rel="noreferrer">Bekijk site ↗</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-border" id="werkwijze">
        <div className="container process-layout">
          <div className="process-intro" data-reveal><span className="eyebrow">Werkwijze</span><h2>Van idee naar live.</h2><p>Korte stappen, duidelijke feedbackmomenten en geen ingewikkeld proces.</p></div>
          <div className="process-list">
            {steps.map(([number, title, text]) => (
              <article key={title} data-reveal><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section contact-section" id="contact">
        <div className="container contact-grid">
          <div className="contact-copy" data-reveal><span className="eyebrow">Contact</span><h2>Klaar om iets sterks te bouwen?</h2><p>Stuur kort wat je nodig hebt. Je hoeft nog geen compleet plan te hebben.</p><a href="mailto:info@voidworks.eu">info@voidworks.eu</a></div>
          <div data-reveal><ContactForm /></div>
        </div>
      </section>
    </main>
  );
}
