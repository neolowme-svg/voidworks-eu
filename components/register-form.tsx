"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/components/preferences-provider";
import { BotChallenge } from "@/components/bot-challenge";

const OTP_LENGTH = 6;

function passwordStrength(value: string) {
  const checks = { length:value.length >= 12, lower:/[a-z]/.test(value), upper:/[A-Z]/.test(value), number:/\d/.test(value), symbol:/[^A-Za-z0-9\s]/.test(value) };
  const count = Object.values(checks).filter(Boolean).length;
  return { checks, count, valid:count === 5 };
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { text } = usePreferences();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const startedAt = useRef(Date.now());
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const strength = useMemo(() => passwordStrength(password), [password]);
  const code = digits.join("");
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const labels = [...text.auth.rules];
  const checks = [strength.checks.length, strength.checks.lower, strength.checks.upper, strength.checks.number, strength.checks.symbol];
  const strengthLabel = !password ? text.auth.empty : strength.count <= 1 ? text.auth.weak : strength.count <= 3 ? text.auth.fair : strength.count === 4 ? text.auth.strong : text.auth.veryStrong;

  useEffect(() => {
    const verifyEmail = searchParams.get("verify");
    if (verifyEmail && !verifyOpen) {
      setPendingEmail(verifyEmail.trim().toLowerCase());
      setDigits(Array(OTP_LENGTH).fill(""));
      setCooldown(0);
      setVerifyOpen(true);
      window.setTimeout(() => inputs.current[0]?.focus(), 80);
    }
  }, [searchParams, verifyOpen]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function errorText(codeValue: string) {
    if (codeValue === "EMAIL_REGISTERED") return text.auth.emailRegistered;
    if (codeValue === "RATE_LIMIT") return text.auth.rateLimit;
    if (codeValue === "BOT_CHECK_FAILED") return text.auth.botFailed;
    if (codeValue === "EMAIL_SEND_FAILED") return text.auth.emailUnavailable;
    return text.auth.loginFailed;
  }

  function openVerification(email: string, name: string) {
    setPendingEmail(email); setPendingName(name); setDigits(Array(OTP_LENGTH).fill("")); setCooldown(60); setStatus(""); setVerifyOpen(true);
    window.setTimeout(() => inputs.current[0]?.focus(), 80);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const passwordValue = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const companyWebsite = String(form.get("companyWebsite") ?? "");
    if (name.length < 2) return setStatus(text.auth.namePlaceholder);
    if (!strength.valid) return setStatus(`${text.auth.need}: ${labels.filter((_, index) => !checks[index]).join(", ")}.`);
    if (passwordValue !== confirm) return setStatus(text.auth.noMatch);

    setBusy(true);
    try {
      const response = await fetch("/api/auth/register", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ name, email, password:passwordValue, companyWebsite, startedAt:startedAt.current, turnstileToken, locale:document.documentElement.lang }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setStatus(errorText(String(result.error || ""))); return; }
      openVerification(email, name);
    } finally { setBusy(false); }
  }

  function setDigit(index:number, raw:string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    setDigits((current) => { const next=[...current]; next[index]=value; return next; });
    if (value && index < OTP_LENGTH-1) inputs.current[index+1]?.focus();
  }
  function keyDown(index:number, event:KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index>0) inputs.current[index-1]?.focus();
    if (event.key === "ArrowLeft" && index>0) inputs.current[index-1]?.focus();
    if (event.key === "ArrowRight" && index<OTP_LENGTH-1) inputs.current[index+1]?.focus();
  }
  function pasteCode(textValue:string) {
    const clean=textValue.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!clean) return;
    setDigits(Array.from({length:OTP_LENGTH},(_,index)=>clean[index]??""));
    inputs.current[Math.max(0,Math.min(clean.length,OTP_LENGTH)-1)]?.focus();
  }

  async function startSession() {
    const response = await fetch("/api/auth/session/start", { method:"POST" });
    return response.ok;
  }

  async function verify(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!/^\d{6}$/.test(code)) return setStatus(text.auth.invalidCode);
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/auth/verify-email", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:pendingEmail, code }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setStatus(result.error === "RATE_LIMIT" ? text.auth.rateLimit : text.auth.invalidCode); return; }
      if (!password) { setVerifyOpen(false); router.replace("/login"); router.refresh(); return; }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email:pendingEmail, password });
      if (error || !(await startSession())) { setVerifyOpen(false); router.replace("/login"); router.refresh(); return; }
      setVerifyOpen(false); router.replace("/dashboard"); router.refresh();
    } finally { setBusy(false); }
  }

  async function resend() {
    if (busy || cooldown > 0 || !pendingEmail) return;
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/auth/resend-verification", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:pendingEmail, locale:document.documentElement.lang }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setStatus(result.error === "RATE_LIMIT" ? text.auth.rateLimit : text.auth.loginFailed); return; }
      setDigits(Array(OTP_LENGTH).fill("")); setCooldown(60); setStatus(text.auth.codeSent); window.setTimeout(() => inputs.current[0]?.focus(),80);
    } finally { setBusy(false); }
  }

  return <>
    <div className="auth-card auth-card-readable"><div className="auth-heading"><span>{text.auth.area}</span><h1>{text.auth.registerTitle}</h1><p>{text.auth.registerText}</p></div>
      <form className="auth-form" onSubmit={register}>
        <input className="honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <label>{text.auth.name}<input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required placeholder={text.auth.namePlaceholder} /></label>
        <label>{text.auth.email}<input name="email" type="email" autoComplete="email" required placeholder={text.contact.placeholderEmail} /></label>
        <label>{text.auth.password}<span className="password-input"><input name="password" type={visible?"text":"password"} autoComplete="new-password" minLength={12} required value={password} onChange={(event)=>setPassword(event.target.value)} placeholder={text.auth.passwordPlaceholder} /><button type="button" onClick={()=>setVisible((value)=>!value)}>{visible?text.auth.hide:text.auth.show}</button></span></label>
        <div className="strength" data-score={strength.count}>
          <div className="strength-head"><span>{text.auth.strength}</span><strong>{strengthLabel}</strong></div><div className="strength-line"><span/><span/><span/><span/><span/></div>
          <div className="password-rules">{labels.map((label,index)=><span key={label} data-ok={checks[index]}><b>{checks[index]?"✓":"•"}</b>{label}</span>)}</div>
          {!strength.valid && password && <p className="strength-missing">{text.auth.need}: {labels.filter((_,index)=>!checks[index]).join(", ")}.</p>}
        </div>
        <label>{text.auth.passwordAgain}<span className="password-input"><input name="confirm" type={confirmVisible?"text":"password"} autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event)=>setConfirmPassword(event.target.value)} placeholder={text.auth.repeatPlaceholder} /><button type="button" onClick={()=>setConfirmVisible((value)=>!value)}>{confirmVisible?text.auth.hide:text.auth.show}</button></span>{confirmPassword && <small className={passwordsMatch?"match-ok":"match-bad"}>{passwordsMatch?`✓ ${text.auth.match}`:`✕ ${text.auth.noMatch}`}</small>}</label>
        <BotChallenge onToken={setTurnstileToken} />
        <button className="button button-primary auth-submit" disabled={busy}>{busy?text.auth.creating:text.auth.makeAccount}</button>
      </form>
      <p className={`auth-status ${status?"show":""}`} aria-live="polite">{status}</p><p className="auth-switch">{text.auth.haveAccount} <Link href="/login">{text.auth.login}</Link></p>
    </div>

    {verifyOpen && <div className="modal-backdrop"><div className="verify-modal" role="dialog" aria-modal="true" aria-labelledby="verify-title">
      <div className="verify-topline"><div className="verify-icon">V</div><span className="verify-state"><i />{text.auth.codeSent}</span></div>
      <span className="eyebrow">{text.auth.verifyEyebrow}</span><h2 id="verify-title">{text.auth.verifyTitle}</h2><p>{text.auth.verifyText} <strong>{pendingEmail}</strong>. {pendingName && <span>{pendingName}, </span>}{text.auth.codeHint}</p>
      <form onSubmit={verify}><div className="otp-boxes otp-six" onPaste={(event)=>{event.preventDefault();pasteCode(event.clipboardData.getData("text"));}}>{digits.map((digit,index)=><input key={index} ref={(node)=>{inputs.current[index]=node;}} value={digit} inputMode="numeric" pattern="[0-9]*" maxLength={1} aria-label={`${text.auth.codeDigit} ${index+1}`} onChange={(event)=>setDigit(index,event.target.value)} onKeyDown={(event)=>keyDown(index,event)} />)}</div><button className="button button-primary verify-submit" disabled={busy || code.length!==6}>{busy?text.auth.verifying:text.auth.verifyButton}</button></form>
      <p className={`auth-status ${status?"show":""}`} aria-live="polite">{status}</p><div className="verify-help"><button type="button" className="text-button" onClick={resend} disabled={busy || cooldown>0}>{cooldown>0?`${text.auth.resendIn} ${cooldown}s`:text.auth.resend}</button><button type="button" className="text-button" onClick={()=>{setVerifyOpen(false);setStatus("");}}>{text.auth.changeEmail}</button></div>
    </div></div>}
  </>;
}
