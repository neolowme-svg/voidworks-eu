import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";

const services = [
  {
    title: "Websites",
    text: "Een complete website die past bij je bedrijf. Snel, responsive en zonder standaard template-look.",
    tags: ["Webdesign", "Development", "Responsive"],
  },
  {
    title: "Webapplicaties",
    text: "Dashboards, klantportalen en andere maatwerk functies als een gewone website niet genoeg is.",
    tags: ["Dashboards", "Portalen", "Maatwerk"],
  },
  {
    title: "Redesign",
    text: "Een bestaande site opnieuw opbouwen als hij verouderd is, niet goed werkt op mobiel of gewoon beter kan.",
    tags: ["UX", "Performance", "Rebuild"],
  },
  {
    title: "Hosting & onderhoud",
    text: "Na de oplevering kunnen we hosting, updates en kleine wijzigingen gewoon blijven regelen.",
    tags: ["Vercel", "Onderhoud", "Updates"],
  },
];

const steps = [
  ["Eerst kijken wat je nodig hebt", "We bespreken kort wat de site moet doen, voor wie hij is en wat je belangrijk vindt."],
  ["Ontwerp maken", "Daarna zetten we de stijl en pagina-opbouw neer. Je ziet dus eerst hoe het gaat worden."],
  ["Bouwen en testen", "We bouwen de site responsive en testen desktop, tablet en mobiel."],
  ["Live zetten", "Na de laatste aanpassingen gaat alles live op je eigen domein."],
];

export default function HomePage() {
  return (
    <main className="page page-home" id="top">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy" data-reveal>
            <span className="eyebrow">Webdesign & development</span>
            <h1>
              Websites die goed ogen en <em>gewoon goed werken.</em>
            </h1>
            <p>
              Geen onnodige effecten en geen standaard template. We maken iets
              dat past bij je bedrijf en prettig werkt op ieder scherm.
            </p>

            <div className="hero-actions">
              <Link className="button button-primary" href="/#contact">
                Project starten <span className="button-arrow">↗</span>
              </Link>
              <Link className="button button-secondary" href="/#projecten">
                Bekijk projecten
              </Link>
            </div>
          </div>

          <div className="hero-card" data-reveal>
            <div className="hero-card-top">
              <Image
                src="/assets/voidworks-mark.png"
                alt=""
                width={180}
                height={180}
                priority
              />
              <span>voidworks.eu</span>
            </div>
            <h2>Van eerste idee tot een site die live staat.</h2>
            <div className="hero-list">
              <span>Websites op maat</span>
              <span>Webapps & dashboards</span>
              <span>Hosting & onderhoud</span>
            </div>
          </div>
        </div>
      </section>

      <section className="small-strip">
        <div className="container small-strip-grid">
          <span>Design</span>
          <span>Development</span>
          <span>Responsive</span>
          <span>Performance</span>
          <span>Onderhoud</span>
        </div>
      </section>

      <section className="section" id="diensten">
        <div className="container">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow">Diensten</span>
              <h2>Wat we voor je kunnen maken.</h2>
            </div>
            <p>
              Alles blijft overzichtelijk. Design en development zitten bij
              elkaar, dus aanpassingen kunnen snel door.
            </p>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.title} data-reveal>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <div className="tag-row">
                  {service.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section projects-section" id="projecten">
        <div className="container">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow">Projecten</span>
              <h2>Werk dat al online staat.</h2>
            </div>
            <p>
              Niet ieder project hoeft op elkaar te lijken. De site moet vooral
              bij het merk en de mensen die hem gebruiken passen.
            </p>
          </div>

          <div className="project-grid">
            <article className="project-card" data-reveal>
              <a
                className="project-shot"
                href="https://fentexrp.nl/"
                target="_blank"
                rel="noreferrer"
                aria-label="Open Fentex Roleplay"
              >
                <Image
                  src="/assets/projects/fentex-home.png"
                  alt="Homepage van Fentex Roleplay"
                  width={1899}
                  height={907}
                  sizes="(max-width: 900px) 100vw, 50vw"
                />
              </a>
              <div className="project-copy">
                <div>
                  <span>Community website</span>
                  <h3>Fentex Roleplay</h3>
                  <p>
                    Website voor een Nederlandse FiveM-community met een
                    duidelijke route naar de belangrijkste onderdelen.
                  </p>
                </div>
                <a href="https://fentexrp.nl/" target="_blank" rel="noreferrer">
                  Bekijk site ↗
                </a>
              </div>
            </article>

            <article className="project-card" data-reveal>
              <a
                className="project-shot"
                href="https://www.flexwrap.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Open Flexwrap"
              >
                <Image
                  src="/assets/projects/flexwrap-home.png"
                  alt="Homepage van Flexwrap"
                  width={1901}
                  height={908}
                  sizes="(max-width: 900px) 100vw, 50vw"
                />
              </a>
              <div className="project-copy">
                <div>
                  <span>Bedrijfswebsite</span>
                  <h3>Flexwrap</h3>
                  <p>
                    Een zakelijke site met een duidelijke eigen stijl,
                    overzichtelijke informatie en een sterke mobiele versie.
                  </p>
                </div>
                <a href="https://www.flexwrap.com/" target="_blank" rel="noreferrer">
                  Bekijk site ↗
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section process-section" id="werkwijze">
        <div className="container process-layout">
          <div className="process-intro" data-reveal>
            <span className="eyebrow">Werkwijze</span>
            <h2>Geen lang gedoe. Gewoon duidelijk.</h2>
            <p>
              We werken in korte stappen. Daardoor kun je snel meekijken en
              hoeft niet alles pas aan het einde aangepast te worden.
            </p>
          </div>

          <div className="process-list">
            {steps.map(([title, text], index) => (
              <article key={title} data-reveal>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section why-section">
        <div className="container why-card" data-reveal>
          <div>
            <span className="eyebrow">Voidworks</span>
            <h2>Mooi is niet genoeg.</h2>
          </div>
          <div className="why-points">
            <article>
              <h3>Snel</h3>
              <p>Geen zware rommel die je site onnodig traag maakt.</p>
            </article>
            <article>
              <h3>Responsive</h3>
              <p>Desktop en mobiel worden vanaf het begin meegenomen.</p>
            </article>
            <article>
              <h3>Makkelijk aan te passen</h3>
              <p>We houden de techniek logisch en onderhoudbaar.</p>
            </article>
            <article>
              <h3>Ook na livegang</h3>
              <p>Voor updates en kleine aanpassingen kun je gewoon terugkomen.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="container faq-layout">
          <div data-reveal>
            <span className="eyebrow">FAQ</span>
            <h2>Vragen die vaak langskomen.</h2>
          </div>

          <div className="faq-list">
            <details data-reveal>
              <summary>
                Kunnen jullie mijn huidige website opnieuw maken?
                <span>+</span>
              </summary>
              <p>
                Ja. We kunnen de bestaande inhoud houden en de rest opnieuw
                ontwerpen en bouwen.
              </p>
            </details>
            <details data-reveal>
              <summary>
                Kan ik later zelf dingen aanpassen?
                <span>+</span>
              </summary>
              <p>
                Ja. Als je dat nodig hebt kunnen we een adminpanel of andere
                beheeromgeving toevoegen.
              </p>
            </details>
            <details data-reveal>
              <summary>
                Werkt alles ook op mobiel?
                <span>+</span>
              </summary>
              <p>
                Ja. Mobiel is geen extra stap achteraf. Het zit vanaf het begin
                in het ontwerp.
              </p>
            </details>
            <details data-reveal>
              <summary>
                Kunnen jullie hosting ook regelen?
                <span>+</span>
              </summary>
              <p>
                Ja. Hosting, deployments en onderhoud kunnen we gewoon blijven
                doen nadat de site live staat.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="section contact-section" id="contact">
        <div className="container contact-grid">
          <div className="contact-copy" data-reveal>
            <span className="eyebrow">Contact</span>
            <h2>Wat wil je laten maken?</h2>
            <p>
              Stuur kort wat je nodig hebt. Je hoeft nog niet alles uitgewerkt
              te hebben.
            </p>
            <a href="mailto:info@voidworks.eu">info@voidworks.eu</a>
          </div>
          <div data-reveal>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
