"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register" | "forgot";

function strengthOf(value: string) {
  const checks = {
    length: value.length >= 12,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9\s]/.test(value),
  };

  const count = Object.values(checks).filter(Boolean).length;
  const level = value.length === 0 ? 0 : count <= 2 ? 1 : count === 3 ? 2 : count === 4 ? 3 : 4;
  const label = ["", "Zwak", "Redelijk", "Goed", "Sterk"][level];

  return { checks, level, label };
}

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => strengthOf(password), [password]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const passwordValue = String(form.get("password") ?? "");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordValue,
    });

    if (error) {
      setBusy(false);
      setStatus("E-mail of wachtwoord klopt niet.");
      return;
    }

    const next = searchParams.get("next");
    router.push(next?.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const passwordValue = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (name.length < 2) {
      setStatus("Vul je naam in.");
      return;
    }

    if (strength.level < 4) {
      setStatus("Kies een wachtwoord dat aan alle eisen voldoet.");
      return;
    }

    if (passwordValue !== confirm) {
      setStatus("De wachtwoorden zijn niet hetzelfde.");
      return;
    }

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

    if (error) {
      setStatus(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setStatus("Account aangemaakt. Check je mail om je account te bevestigen.");
  }

  async function forgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setBusy(false);

    if (error) {
      setStatus("Dat ging niet goed. Probeer het nog een keer.");
      return;
    }

    setStatus("Als het adres bestaat, staat er zo een resetlink in je mail.");
  }

  return (
    <div className="auth-card">
      <div className="auth-heading">
        <span>Klantomgeving</span>
        <h1>
          {mode === "login"
            ? "Inloggen"
            : mode === "register"
              ? "Account maken"
              : "Wachtwoord vergeten"}
        </h1>
        <p>
          {mode === "login"
            ? "Log in om je projecten en updates te bekijken."
            : mode === "register"
              ? "Maak een account aan met je e-mailadres."
              : "Vul je e-mailadres in. Je krijgt een link om een nieuw wachtwoord te kiezen."}
        </p>
      </div>

      {mode !== "forgot" && (
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setStatus("");
            }}
          >
            Inloggen
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setStatus("");
            }}
          >
            Account maken
          </button>
        </div>
      )}

      {mode === "login" && (
        <form className="auth-form" onSubmit={login}>
          <label>
            E-mail
            <input type="email" name="email" autoComplete="email" required placeholder="naam@bedrijf.nl" />
          </label>

          <label>
            Wachtwoord
            <span className="password-input">
              <input
                type={visible ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                minLength={8}
                placeholder="Wachtwoord"
              />
              <button type="button" onClick={() => setVisible((v) => !v)}>
                {visible ? "Verbergen" : "Tonen"}
              </button>
            </span>
          </label>

          <button
            type="button"
            className="text-button forgot-link"
            onClick={() => {
              setMode("forgot");
              setStatus("");
            }}
          >
            Wachtwoord vergeten?
          </button>

          <button className="button button-primary auth-submit" type="submit" disabled={busy}>
            {busy ? "Inloggen..." : "Inloggen"}
          </button>
        </form>
      )}

      {mode === "register" && (
        <form className="auth-form" onSubmit={register}>
          <label>
            Naam
            <input type="text" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Jouw naam" />
          </label>

          <label>
            E-mail
            <input type="email" name="email" autoComplete="email" required placeholder="naam@bedrijf.nl" />
          </label>

          <label>
            Wachtwoord
            <span className="password-input">
              <input
                type={visible ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimaal 12 tekens"
              />
              <button type="button" onClick={() => setVisible((v) => !v)}>
                {visible ? "Verbergen" : "Tonen"}
              </button>
            </span>
          </label>

          <div className="strength" data-level={strength.level}>
            <div className="strength-line">
              <span /><span /><span /><span />
            </div>
            <div className="strength-title">
              <span>Wachtwoordsterkte</span>
              <strong>{strength.label || "—"}</strong>
            </div>
            <div className="password-rules">
              <span className={strength.checks.length ? "valid" : ""}>12+ tekens</span>
              <span className={strength.checks.lower ? "valid" : ""}>kleine letter</span>
              <span className={strength.checks.upper ? "valid" : ""}>hoofdletter</span>
              <span className={strength.checks.number ? "valid" : ""}>cijfer</span>
              <span className={strength.checks.symbol ? "valid" : ""}>speciaal teken</span>
            </div>
          </div>

          <label>
            Wachtwoord nog een keer
            <span className="password-input">
              <input
                type={confirmVisible ? "text" : "password"}
                name="confirm"
                autoComplete="new-password"
                required
                minLength={12}
                placeholder="Herhaal je wachtwoord"
              />
              <button type="button" onClick={() => setConfirmVisible((v) => !v)}>
                {confirmVisible ? "Verbergen" : "Tonen"}
              </button>
            </span>
          </label>

          <button className="button button-primary auth-submit" type="submit" disabled={busy}>
            {busy ? "Account maken..." : "Account maken"}
          </button>
        </form>
      )}

      {mode === "forgot" && (
        <form className="auth-form" onSubmit={forgot}>
          <label>
            E-mail
            <input type="email" name="email" autoComplete="email" required placeholder="naam@bedrijf.nl" />
          </label>

          <button className="button button-primary auth-submit" type="submit" disabled={busy}>
            {busy ? "Versturen..." : "Resetlink sturen"}
          </button>

          <button
            type="button"
            className="text-button back-login"
            onClick={() => {
              setMode("login");
              setStatus("");
            }}
          >
            ← Terug naar inloggen
          </button>
        </form>
      )}

      <p className={`auth-status ${status ? "show" : ""}`} aria-live="polite">
        {status}
      </p>
    </div>
  );
}
