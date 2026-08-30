import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Nieuw wachtwoord",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="page auth-page">
      <section className="auth-section">
        <div className="container auth-layout single-auth">
          <div className="auth-side" data-reveal>
            <span className="eyebrow">Account</span>
            <h2>Kies een nieuw wachtwoord.</h2>
            <p>
              Gebruik minimaal 12 tekens met een hoofdletter, kleine letter,
              cijfer en speciaal teken.
            </p>
          </div>

          <div className="auth-card" data-reveal>
            <div className="auth-heading">
              <span>Wachtwoord</span>
              <h1>Nieuw wachtwoord</h1>
              <p>Vul je nieuwe wachtwoord twee keer in.</p>
            </div>
            <ResetPasswordForm />
          </div>
        </div>
      </section>
    </main>
  );
}
