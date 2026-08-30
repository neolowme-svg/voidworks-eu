"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePreferences } from "@/components/preferences-provider";
import { BotChallenge } from "@/components/bot-challenge";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { text, locale } = usePreferences();
  const [forgot, setForgot] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeReady, setChallengeReady] = useState(false);
  const [challengeKey, setChallengeKey] = useState(0);
  const startedAt = useRef(Date.now());
  const reason = searchParams.get("reason");
  const reasonText = reason === "session-expired" ? text.auth.sessionExpired : "";

  useEffect(() => { setStatus(""); }, [locale]);

  function resetChallenge() {
    setTurnstileToken("");
    setChallengeReady(false);
    setChallengeKey((value) => value + 1);
    startedAt.current = Date.now();
  }

  function authError(code: string) {
    if (code === "INVALID_CREDENTIALS") return text.auth.loginFailed;
    if (code === "EMAIL_NOT_VERIFIED") return text.auth.verifyFirst;
    if (code === "RATE_LIMIT") return text.auth.rateLimit;
    if (code === "BOT_CHECK_FAILED") return text.auth.botFailed;
    if (code === "SECURITY_UNAVAILABLE") return text.auth.securityUnavailable;
    if (code === "INVALID_FORM") return text.auth.invalidInput;
    return text.auth.serviceError;
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    if (!challengeReady) return setStatus(text.auth.securityWaiting);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const companyWebsite = String(form.get("companyWebsite") ?? "");
    setBusy(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password, companyWebsite, startedAt: startedAt.current, turnstileToken }),
      });
      const result = await response.json().catch(() => ({}));
      resetChallenge();

      if (!response.ok) {
        const code = String(result.error || "");
        if (code === "EMAIL_NOT_VERIFIED") {
          await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ email, locale }),
          }).catch(() => null);
          router.replace(`/register?verify=${encodeURIComponent(email)}`);
          router.refresh();
          return;
        }
        setStatus(authError(code));
        return;
      }

      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch {
      resetChallenge();
      setStatus(text.auth.serviceError);
    } finally {
      setBusy(false);
    }
  }

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeReady) return setStatus(text.auth.securityWaiting);
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const companyWebsite = String(form.get("companyWebsite") ?? "");

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, companyWebsite, startedAt: startedAt.current, turnstileToken, locale }),
      });
      const result = await response.json().catch(() => ({}));
      resetChallenge();
      if (response.ok) setStatus(text.auth.resetGeneric);
      else if (result.error === "RATE_LIMIT") setStatus(text.auth.rateLimit);
      else if (result.error === "BOT_CHECK_FAILED") setStatus(text.auth.botFailed);
      else if (result.error === "SECURITY_UNAVAILABLE") setStatus(text.auth.securityUnavailable);
      else setStatus(text.auth.serviceError);
    } catch {
      resetChallenge();
      setStatus(text.auth.serviceError);
    } finally {
      setBusy(false);
    }
  }

  const challenge = <>
    <BotChallenge key={challengeKey} onToken={setTurnstileToken} onReady={setChallengeReady} />
    {!challengeReady && <small className="security-status">{text.auth.securityWaiting}</small>}
  </>;

  return <div className="auth-card auth-card-readable">
    <div className="auth-heading"><span>{text.auth.area}</span><h1>{forgot ? text.auth.resetTitle : text.auth.loginTitle}</h1><p>{forgot ? text.auth.resetText : text.auth.loginText}</p></div>
    {forgot ? <form className="auth-form" onSubmit={reset}>
      <input className="honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label>{text.auth.email}<input name="email" type="email" autoComplete="email" required placeholder={text.contact.placeholderEmail} /></label>
      {challenge}
      <button className="button button-primary auth-submit" disabled={busy || !challengeReady}>{busy ? text.auth.sending : text.auth.resetSend}</button>
      <button className="text-button" type="button" onClick={() => { setForgot(false); setStatus(""); resetChallenge(); }}>{text.auth.back}</button>
    </form> : <form className="auth-form" onSubmit={login}>
      <input className="honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label>{text.auth.email}<input name="email" type="email" autoComplete="email" required placeholder={text.contact.placeholderEmail} /></label>
      <label>{text.auth.password}<span className="password-input"><input name="password" type={visible ? "text" : "password"} autoComplete="current-password" required placeholder={text.auth.password} /><button type="button" onClick={() => setVisible((value) => !value)}>{visible ? text.auth.hide : text.auth.show}</button></span></label>
      <button className="text-button forgot-link" type="button" onClick={() => { setForgot(true); setStatus(""); resetChallenge(); }}>{text.auth.forgot}</button>
      {challenge}
      <button className="button button-primary auth-submit" disabled={busy || !challengeReady}>{busy ? text.auth.loggingIn : text.auth.login}</button>
    </form>}
    <p className={`auth-status ${status || reasonText ? "show" : ""}`} aria-live="polite">{status || reasonText}</p>
    {!forgot && <p className="auth-switch">{text.auth.noAccount} <Link href="/register">{text.auth.makeAccount}</Link></p>}
  </div>;
}
