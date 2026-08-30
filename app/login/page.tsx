import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPanel } from "@/components/auth-panel";

export const metadata: Metadata = {
  title: "Inloggen",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="page auth-page">
      <section className="auth-section">
        <div className="container auth-layout">
          <div className="auth-side" data-reveal>
            <span className="eyebrow">Klantomgeving</span>
            <h2>Alles van je project op één plek.</h2>
            <p>
              Log in om je projecten, status en updates te bekijken.
            </p>

            <div className="auth-side-list">
              <span>Projectstatus bekijken</span>
              <span>Updates per project</span>
              <span>Beveiligd account</span>
            </div>
          </div>

          <div data-reveal>
            <Suspense fallback={<div className="auth-card auth-loading">Laden...</div>}>
              <AuthPanel />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
