"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const OTP_LENGTH = 8;

function passwordStrength(value: string) {
  const checks = {
    length: value.length >= 12,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9\s]/.test(value),
  };
  const count = Object.values(checks).filter(Boolean).length;
  const label = count <= 1 ? "Zwak" : count <= 3 ? "Redelijk" : count === 4 ? "Sterk" : "Zeer sterk";
  return { checks, count, label, valid: count === 5 };
}

export function RegisterForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const strength = useMemo(() => passwordStrength(password), [password]);
  const code = digits.join("");
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function openVerification(email: string) {
    setPendingEmail(email);
    setDigits(Array(OTP_LENGTH).fill(""));
    setCooldown(60);
    setStatus("");
    setVerifyOpen(true);
    window.setTimeout(() => inputs.current[0]?.focus(), 80);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const passwordValue = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (name.length < 2) return setStatus("Vul je naam in.");
    if (!strength.valid) return setStatus("Maak je wachtwoord eerst volledig sterk.");
    if (passwordValue !== confirm) return setStatus("De wachtwoorden zijn niet hetzelfde.");

    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwordValue,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    setBusy(false);

    if (error) return setStatus(error.message);
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    openVerification(email);
  }

  function setDigit(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function keyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function pasteCode(text: string) {
    const clean = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!clean) return;
    setDigits(Array.from({ length: OTP_LENGTH }, (_, index) => clean[index] ?? ""));
    inputs.current[Math.max(0, Math.min(clean.length, OTP_LENGTH) - 1)]?.focus();
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) return;

    setBusy(true);
    setStatus("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: pendingEmail, token: code, type: "email" });
    setBusy(false);

    if (error) return setStatus("De code klopt niet of is verlopen. Vraag hieronder een nieuwe code aan.");

    setVerifyOpen(false);
    router.replace("/dashboard");
    router.refresh();
  }

  async function resend() {
    if (busy || cooldown > 0 || !pendingEmail) return;
    setBusy(true);
    setStatus("");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    setBusy(false);
    if (error) return setStatus(`Nieuwe code versturen lukt niet: ${error.message}`);
    setDigits(Array(OTP_LENGTH).fill(""));
    setCooldown(60);
    setStatus("Nieuwe code verstuurd. Controleer ook spam/ongewenst.");
    window.setTimeout(() => inputs.current[0]?.focus(), 80);
  }

  return (
    <>
      <div className="auth-card">
        <div className="auth-heading">
          <span>Klantomgeving</span>
          <h1>Account maken</h1>
          <p>Maak je account aan. Daarna bevestig je je e-mail met de 8-cijferige code uit je mail.</p>
        </div>

        <form className="auth-form" onSubmit={register}>
          <label>Naam<input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required placeholder="Jouw naam" /></label>
          <label>E-mail<input name="email" type="email" autoComplete="email" required placeholder="naam@bedrijf.nl" /></label>
          <label>
            Wachtwoord
            <span className="password-input">
              <input name="password" type={visible ? "text" : "password"} autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimaal 12 tekens" />
              <button type="button" onClick={() => setVisible((value) => !value)}>{visible ? "Verbergen" : "Tonen"}</button>
            </span>
          </label>

          <div className="strength" data-score={strength.count}>
            <div className="strength-head"><span>Wachtwoordsterkte</span><strong>{password ? strength.label : "Nog leeg"}</strong></div>
            <div className="strength-line"><span /><span /><span /><span /><span /></div>
            <div className="password-rules">
              <span data-ok={strength.checks.length}>✓ 12+ tekens</span>
              <span data-ok={strength.checks.lower}>✓ kleine letter</span>
              <span data-ok={strength.checks.upper}>✓ hoofdletter</span>
              <span data-ok={strength.checks.number}>✓ cijfer</span>
              <span data-ok={strength.checks.symbol}>✓ speciaal teken</span>
            </div>
            {!strength.valid && password && <p className="strength-missing">Nog nodig: {[
              !strength.checks.length && "12 tekens",
              !strength.checks.lower && "kleine letter",
              !strength.checks.upper && "hoofdletter",
              !strength.checks.number && "cijfer",
              !strength.checks.symbol && "speciaal teken",
            ].filter(Boolean).join(", ")}.</p>}
          </div>

          <label>
            Wachtwoord herhalen
            <span className="password-input">
              <input name="confirm" type={confirmVisible ? "text" : "password"} autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Herhaal je wachtwoord" />
              <button type="button" onClick={() => setConfirmVisible((value) => !value)}>{confirmVisible ? "Verbergen" : "Tonen"}</button>
            </span>
            {confirmPassword && <small className={passwordsMatch ? "match-ok" : "match-bad"}>{passwordsMatch ? "✓ Wachtwoorden komen overeen" : "✕ Wachtwoorden komen niet overeen"}</small>}
          </label>

          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Account maken..." : "Account maken"}</button>
        </form>

        <p className={`auth-status ${status ? "show" : ""}`} aria-live="polite">{status}</p>
        <p className="auth-switch">Heb je al een account? <Link href="/login">Inloggen</Link></p>
      </div>

      {verifyOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="verify-modal" role="dialog" aria-modal="true" aria-labelledby="verify-title">
            <div className="verify-topline"><div className="verify-icon">V</div><span className="verify-state"><i /> Code verstuurd</span></div>
            <span className="eyebrow">E-mail verificatie</span>
            <h2 id="verify-title">Vul je 8-cijferige code in.</h2>
            <p>We hebben een verificatiecode gestuurd naar <strong>{pendingEmail}</strong>.</p>

            <form onSubmit={verify} className="verify-form">
              <div className="otp-boxes" onPaste={(event) => { event.preventDefault(); pasteCode(event.clipboardData.getData("text")); }}>
                {digits.map((digit, index) => (
                  <input key={index} ref={(node) => { inputs.current[index] = node; }} aria-label={`Cijfer ${index + 1} van verificatiecode`} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} value={digit} onChange={(event) => setDigit(index, event.target.value)} onKeyDown={(event) => keyDown(index, event)} />
                ))}
              </div>
              <button className="button button-primary verify-submit" disabled={busy || code.length !== OTP_LENGTH}>{busy ? "Controleren..." : "Code bevestigen"}</button>
            </form>

            <div className="verify-help"><span>Geen mail gekregen?</span><button className="text-button" type="button" onClick={resend} disabled={busy || cooldown > 0}>{cooldown > 0 ? `Opnieuw sturen in ${cooldown}s` : "Nieuwe code sturen"}</button></div>
            <button className="text-button verify-change" type="button" onClick={() => setVerifyOpen(false)}>← E-mailadres aanpassen</button>
            <p className="modal-status" aria-live="polite">{status}</p>
          </div>
        </div>
      )}
    </>
  );
}
