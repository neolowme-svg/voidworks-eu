"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function passwordStrength(value: string) {
  const checks = {
    length: value.length >= 12,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9\s]/.test(value),
  };
  const count = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    level: value.length ? Math.max(1, Math.min(4, count)) : 0,
    valid: count === 5,
  };
}

export function RegisterForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const strength = useMemo(() => passwordStrength(password), [password]);
  const code = digits.join("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function openVerification(email: string) {
    setPendingEmail(email);
    setDigits(["", "", "", "", "", ""]);
    setCooldown(45);
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
    if (!strength.valid) return setStatus("Je wachtwoord voldoet nog niet aan alle eisen.");
    if (passwordValue !== confirm) return setStatus("De wachtwoorden zijn niet hetzelfde.");

    setBusy(true);
    const supabase = createClient();
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

    // Bij Confirm email = ON stuurt Supabase nu de bevestigingsmail.
    // De modal opent altijd direct zodat de gebruiker de 6-cijferige OTP kan invoeren.
    openVerification(email);
  }

  function setDigit(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function keyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) inputs.current[index + 1]?.focus();
  }

  function pasteCode(text: string) {
    const clean = text.replace(/\D/g, "").slice(0, 6);
    if (!clean) return;
    const next = Array.from({ length: 6 }, (_, index) => clean[index] ?? "");
    setDigits(next);
    inputs.current[Math.min(clean.length, 6) - 1]?.focus();
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return;

    setBusy(true);
    setStatus("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: "email",
    });
    setBusy(false);

    if (error) {
      return setStatus("De code klopt niet of is verlopen. Vraag hieronder een nieuwe code aan.");
    }

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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    setBusy(false);
    if (error) return setStatus(`Nieuwe code versturen lukt niet: ${error.message}`);
    setDigits(["", "", "", "", "", ""]);
    setCooldown(45);
    setStatus("Nieuwe code verstuurd. Controleer ook spam/ongewenst.");
    window.setTimeout(() => inputs.current[0]?.focus(), 80);
  }

  return (
    <>
      <div className="auth-card">
        <div className="auth-heading">
          <span>Klantomgeving</span>
          <h1>Account maken</h1>
          <p>Maak je account aan. Daarna bevestig je je e-mail met de 6-cijferige code uit je mail.</p>
        </div>

        <form className="auth-form" onSubmit={register}>
          <label>
            Naam
            <input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required placeholder="Jouw naam" />
          </label>
          <label>
            E-mail
            <input name="email" type="email" autoComplete="email" required placeholder="naam@bedrijf.nl" />
          </label>
          <label>
            Wachtwoord
            <span className="password-input">
              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                minLength={12}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimaal 12 tekens"
              />
              <button type="button" onClick={() => setVisible((value) => !value)}>{visible ? "Verbergen" : "Tonen"}</button>
            </span>
          </label>

          <div className="strength" data-level={strength.level}>
            <div className="strength-line"><span /><span /><span /><span /></div>
            <div className="password-rules">
              <span className={strength.checks.length ? "valid" : ""}>12+ tekens</span>
              <span className={strength.checks.upper ? "valid" : ""}>hoofdletter</span>
              <span className={strength.checks.number ? "valid" : ""}>cijfer</span>
              <span className={strength.checks.symbol ? "valid" : ""}>speciaal teken</span>
            </div>
          </div>

          <label>
            Wachtwoord herhalen
            <span className="password-input">
              <input name="confirm" type={confirmVisible ? "text" : "password"} autoComplete="new-password" minLength={12} required placeholder="Herhaal je wachtwoord" />
              <button type="button" onClick={() => setConfirmVisible((value) => !value)}>{confirmVisible ? "Verbergen" : "Tonen"}</button>
            </span>
          </label>

          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Account maken..." : "Account maken"}</button>
        </form>

        <p className={`auth-status ${status ? "show" : ""}`} aria-live="polite">{status}</p>
        <p className="auth-switch">Heb je al een account? <Link href="/login">Inloggen</Link></p>
      </div>

      {verifyOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="verify-modal" role="dialog" aria-modal="true" aria-labelledby="verify-title">
            <div className="verify-topline">
              <div className="verify-icon">V</div>
              <span className="verify-state"><i /> Code verstuurd</span>
            </div>
            <span className="eyebrow">E-mail verificatie</span>
            <h2 id="verify-title">Vul je 6-cijferige code in.</h2>
            <p>We hebben een verificatiecode gestuurd naar <strong>{pendingEmail}</strong>.</p>

            <form onSubmit={verify} className="verify-form">
              <div
                className="otp-boxes"
                onPaste={(event) => {
                  event.preventDefault();
                  pasteCode(event.clipboardData.getData("text"));
                }}
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => { inputs.current[index] = node; }}
                    aria-label={`Cijfer ${index + 1} van verificatiecode`}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => keyDown(index, event)}
                  />
                ))}
              </div>
              <button className="button button-primary verify-submit" disabled={busy || code.length !== 6}>{busy ? "Controleren..." : "Code bevestigen"}</button>
            </form>

            <div className="verify-help">
              <span>Geen mail gekregen?</span>
              <button className="text-button" type="button" onClick={resend} disabled={busy || cooldown > 0}>
                {cooldown > 0 ? `Opnieuw sturen in ${cooldown}s` : "Nieuwe code sturen"}
              </button>
            </div>
            <button className="text-button verify-change" type="button" onClick={() => { setVerifyOpen(false); setStatus(""); }}>
              E-mailadres wijzigen
            </button>
            {status && <p className="modal-status" aria-live="polite">{status}</p>}
          </div>
        </div>
      )}
    </>
  );
}
