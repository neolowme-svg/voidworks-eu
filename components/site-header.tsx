"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  const homeHref = pathname === "/" ? "#top" : "/#top";

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href={homeHref} className="brand" aria-label="Voidworks home">
          <Image
            src="/assets/voidworks-wordmark.png"
            alt="Voidworks"
            width={460}
            height={150}
            priority
          />
        </Link>

        <nav className="desktop-nav" aria-label="Hoofdnavigatie">
          <Link href="/#diensten">Diensten</Link>
          <Link href="/#projecten">Projecten</Link>
          <Link href="/#werkwijze">Werkwijze</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <div className="nav-actions">
          <Link href="/login" className="nav-login">
            Inloggen
          </Link>
          <Link href="/#contact" className="button button-primary nav-cta">
            Project starten
          </Link>
        </div>

        <button
          className={`menu-button ${open ? "active" : ""}`}
          type="button"
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <nav className="container mobile-nav" aria-label="Mobiele navigatie">
          <Link href="/#diensten">Diensten</Link>
          <Link href="/#projecten">Projecten</Link>
          <Link href="/#werkwijze">Werkwijze</Link>
          <Link href="/#contact">Contact</Link>
          <Link href="/login">Inloggen</Link>
          <Link href="/#contact" className="mobile-project-link">
            Project starten
          </Link>
        </nav>
      </div>
    </header>
  );
}
