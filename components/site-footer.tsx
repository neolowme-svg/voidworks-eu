import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-cta">
        <div>
          <span className="footer-kicker">Nieuw project</span>
          <h2>Een website nodig?</h2>
          <p>Stuur kort wat je wilt maken. Dan kijken we wat er nodig is.</p>
        </div>
        <Link href="/#contact" className="button button-primary">
          Neem contact op
        </Link>
      </div>

      <div className="container footer-grid">
        <div className="footer-brand">
          <Image
            src="/assets/voidworks-wordmark.png"
            alt="Voidworks"
            width={460}
            height={150}
          />
          <p>
            Websites en webapplicaties die goed ogen, snel werken en makkelijk
            te gebruiken zijn.
          </p>
        </div>

        <div className="footer-column">
          <strong>Voidworks</strong>
          <Link href="/#diensten">Diensten</Link>
          <Link href="/#projecten">Projecten</Link>
          <Link href="/#werkwijze">Werkwijze</Link>
          <Link href="/#contact">Contact</Link>
        </div>

        <div className="footer-column">
          <strong>Account</strong>
          <Link href="/login">Inloggen</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/login">Wachtwoord vergeten?</Link>
        </div>

        <div className="footer-column">
          <strong>Online</strong>
          <a href="https://fentexrp.nl/" target="_blank" rel="noreferrer">
            Fentex Roleplay ↗
          </a>
          <a href="https://www.flexwrap.com/" target="_blank" rel="noreferrer">
            Flexwrap ↗
          </a>
          <a href="mailto:info@voidworks.eu">info@voidworks.eu</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Voidworks</span>
        <span>voidworks.eu</span>
      </div>
    </footer>
  );
}
