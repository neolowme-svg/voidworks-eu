"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [forgot, setForgot] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setStatus("Inloggen lukt niet. Controleer je gegevens en of je e-mail is bevestigd.");
    const next = searchParams.get("next");
    router.push(next?.startsWith("/") ? next : "/dashboard"); router.refresh();
  }

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setBusy(false);
    setStatus(error ? "Resetmail versturen is niet gelukt." : "Als dit adres bestaat, ontvang je zo een resetmail.");
  }

  return (
    <div className="auth-card">
      <div className="auth-heading"><span>Klantomgeving</span><h1>{forgot ? "Wachtwoord resetten" : "Inloggen"}</h1><p>{forgot ? "We sturen een veilige resetlink naar je e-mailadres." : "Log in om je projecten en updates te bekijken."}</p></div>
      {forgot ? (
        <form className="auth-form" onSubmit={reset}>
          <label>E-mail<input name="email" type="email" autoComplete="email" required placeholder="naam@bedrijf.nl" /></label>
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Versturen..." : "Resetlink sturen"}</button>
          <button className="text-button" type="button" onClick={() => { setForgot(false); setStatus(""); }}>← Terug naar inloggen</button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={login}>
          <label>E-mail<input name="email" type="email" autoComplete="email" required placeholder="naam@bedrijf.nl" /></label>
          <label>Wachtwoord<span className="password-input"><input name="password" type={visible ? "text" : "password"} autoComplete="current-password" required placeholder="Wachtwoord" /><button type="button" onClick={() => setVisible(v => !v)}>{visible ? "Verbergen" : "Tonen"}</button></span></label>
          <button className="text-button forgot-link" type="button" onClick={() => { setForgot(true); setStatus(""); }}>Wachtwoord vergeten?</button>
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Inloggen..." : "Inloggen"}</button>
        </form>
      )}
      <p className={`auth-status ${status ? "show" : ""}`} aria-live="polite">{status}</p>
      {!forgot && <p className="auth-switch">Nog geen account? <Link href="/register">Account maken</Link></p>}
    </div>
  );
}
