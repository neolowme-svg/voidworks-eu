"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/components/preferences-provider";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, text } = usePreferences();
  const [forgot, setForgot] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const reasonText = searchParams.get("reason") === "account-removed" ? text.auth.removed : "";

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();
    await supabase.auth.signOut({ scope:"local" });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setBusy(false); return setStatus(locale === "en" ? "Login failed. Check your details and email verification." : locale === "de" ? "Anmeldung fehlgeschlagen. Prüfe Daten und E-Mail-Bestätigung." : "Inloggen lukt niet. Controleer je gegevens en of je e-mail is bevestigd."); }
    const { data:profile, error:profileError } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    if (profileError || !profile) { await supabase.auth.signOut({ scope:"local" }); setBusy(false); return setStatus(locale === "en" ? "This account no longer exists in Voidworks." : locale === "de" ? "Dieses Konto existiert in Voidworks nicht mehr." : "Dit account bestaat niet meer in Voidworks."); }
    setBusy(false); const next=searchParams.get("next"); router.replace(next?.startsWith("/")?next:"/dashboard"); router.refresh();
  }

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus(""); const form=new FormData(event.currentTarget); const email=String(form.get("email")??"").trim().toLowerCase(); const supabase=createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email,{ redirectTo:`${window.location.origin}/auth/callback?next=/reset-password` }); setBusy(false);
    setStatus(error ? (locale === "en" ? "Could not send reset email." : locale === "de" ? "Reset-E-Mail konnte nicht gesendet werden." : "Resetmail versturen is niet gelukt.") : (locale === "en" ? "If this address exists, a reset email is on its way." : locale === "de" ? "Wenn diese Adresse existiert, erhältst du eine Reset-E-Mail." : "Als dit adres bestaat, ontvang je zo een resetmail."));
  }

  return <div className="auth-card auth-card-readable"><div className="auth-heading"><span>{text.auth.area}</span><h1>{forgot?text.auth.resetTitle:text.auth.loginTitle}</h1><p>{forgot?text.auth.resetText:text.auth.loginText}</p></div>
    {forgot ? <form className="auth-form" onSubmit={reset}><label>{text.auth.email}<input name="email" type="email" autoComplete="email" required placeholder="naam@bedrijf.nl" /></label><button className="button button-primary auth-submit" disabled={busy}>{busy?text.auth.sending:text.auth.resetSend}</button><button className="text-button" type="button" onClick={()=>{setForgot(false);setStatus("");}}>{text.auth.back}</button></form>
      : <form className="auth-form" onSubmit={login}><label>{text.auth.email}<input name="email" type="email" autoComplete="email" required placeholder="naam@bedrijf.nl" /></label><label>{text.auth.password}<span className="password-input"><input name="password" type={visible?"text":"password"} autoComplete="current-password" required placeholder={text.auth.password} /><button type="button" onClick={()=>setVisible((v)=>!v)}>{visible?text.auth.hide:text.auth.show}</button></span></label><button className="text-button forgot-link" type="button" onClick={()=>{setForgot(true);setStatus("");}}>{text.auth.forgot}</button><button className="button button-primary auth-submit" disabled={busy}>{busy?text.auth.loggingIn:text.auth.login}</button></form>}
    <p className={`auth-status ${status || reasonText ? "show" : ""}`} aria-live="polite">{status || reasonText}</p>{!forgot && <p className="auth-switch">{text.auth.noAccount} <Link href="/register">{text.auth.makeAccount}</Link></p>}
  </div>;
}
