"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const onDashboard = pathname.startsWith("/dashboard");
  const onLogin = pathname === "/login";
  const onRegister = pathname === "/register";

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand" aria-label="Voidworks home">
          <Image src="/assets/voidworks-wordmark.png" alt="Voidworks" width={460} height={150} priority />
        </Link>

        <nav className="desktop-nav" aria-label="Hoofdnavigatie">
          <Link href="/#diensten">Diensten</Link>
          <Link href="/#projecten">Projecten</Link>
          <Link href="/#werkwijze">Werkwijze</Link>
          <Link href="/#prijzen">Prijzen</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <div className="nav-actions">
          {onDashboard ? (
            <Link href="/dashboard" className="nav-login">Dashboard</Link>
          ) : onLogin ? (
            <Link href="/register" className="button button-primary nav-cta">Registreren</Link>
          ) : onRegister ? (
            <Link href="/login" className="button button-primary nav-cta">Inloggen</Link>
          ) : (
            <>
              <Link href="/login" className="nav-login">Inloggen</Link>
              <Link href="/#contact" className="button button-primary nav-cta">Project starten</Link>
            </>
          )}
        </div>

        <button className={`menu-button ${open ? "active" : ""}`} type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span /><span /><span />
        </button>
      </div>

      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <nav className="container mobile-nav">
          <Link href="/#diensten">Diensten</Link>
          <Link href="/#projecten">Projecten</Link>
          <Link href="/#werkwijze">Werkwijze</Link>
          <Link href="/#prijzen">Prijzen</Link>
          <Link href="/#contact">Contact</Link>
          <Link href="/login">Inloggen</Link>
          <Link href="/register">Registreren</Link>
        </nav>
      </div>
    </header>
  );
}
