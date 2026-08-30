"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/components/preferences-provider";

const OTP_LENGTH = 6;

function passwordStrength(value: string) {
  const checks = { length:value.length >= 12, lower:/[a-z]/.test(value), upper:/[A-Z]/.test(value), number:/\d/.test(value), symbol:/[^A-Za-z0-9\s]/.test(value) };
  const count = Object.values(checks).filter(Boolean).length;
  return { checks, count, valid:count === 5 };
}

export function RegisterForm() {
  const router = useRouter();
  const { text } = usePreferences();
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
  const labels = [text.auth.rules[0], text.auth.rules[1], text.auth.rules[2], text.auth.rules[3], text.auth.rules[4]];
  const checks = [strength.checks.length, strength.checks.lower, strength.checks.upper, strength.checks.number, strength.checks.symbol];
  const strengthLabel = !password ? text.auth.empty : strength.count <= 1 ? text.auth.weak : strength.count <= 3 ? text.auth.fair : strength.count === 4 ? text.auth.strong : text.auth.veryStrong;

  useEffect(() => { if (cooldown <= 0) return; const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [cooldown]);

  function openVerification(email: string) { setPendingEmail(email); setDigits(Array(OTP_LENGTH).fill("")); setCooldown(60); setStatus(""); setVerifyOpen(true); window.setTimeout(() => inputs.current[0]?.focus(), 80); }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const passwordValue = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (name.length < 2) return setStatus(localeMessage("name"));
    if (!strength.valid) return setStatus(localeMessage("strength"));
    if (passwordValue !== confirm) return setStatus(localeMessage("match"));

    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope:"local" });
    const { data, error } = await supabase.auth.signUp({ email, password:passwordValue, options:{ data:{ full_name:name }, emailRedirectTo:`${window.location.origin}/auth/callback?next=/dashboard` } });
    setBusy(false);
    if (error) return setStatus(error.message);

    // Supabase can return an obfuscated user for an email that still exists in auth.users.
    // In that case no new confirmation email is sent. Do not show a fake code modal.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return setStatus(localeMessage("exists"));
    }
    if (data.session) { router.replace("/dashboard"); router.refresh(); return; }
    openVerification(email);
  }

  function localeMessage(key:"name"|"strength"|"match"|"exists") {
    const nl = { name:"Vul je naam in.", strength:"Je wachtwoord voldoet nog niet aan alle eisen.", match:"De wachtwoorden zijn niet hetzelfde.", exists:"Dit e-mailadres bestaat nog in Supabase Auth. Log in en verwijder het account via Dashboard → Account verwijderen, of verwijder de gebruiker bij Authentication → Users. Daarna kun je opnieuw registreren." };
    const en = { name:"Enter your name.", strength:"Your password does not meet all requirements yet.", match:"The passwords do not match.", exists:"This email address still exists in Supabase Auth. Log in and use Dashboard → Delete account, or delete the user under Authentication → Users. Then you can register again." };
    const de = { name:"Gib deinen Namen ein.", strength:"Dein Passwort erfüllt noch nicht alle Anforderungen.", match:"Die Passwörter stimmen nicht überein.", exists:"Diese E-Mail existiert noch in Supabase Auth. Melde dich an und nutze Dashboard → Konto löschen oder lösche den Benutzer unter Authentication → Users. Danach kannst du dich erneut registrieren." };
    const lang = document.documentElement.lang === "en" ? en : document.documentElement.lang === "de" ? de : nl;
    return lang[key];
  }

  function setDigit(index:number, raw:string) { const value = raw.replace(/\D/g, "").slice(-1); setDigits((current) => { const next=[...current]; next[index]=value; return next; }); if (value && index < OTP_LENGTH-1) inputs.current[index+1]?.focus(); }
  function keyDown(index:number, event:KeyboardEvent<HTMLInputElement>) { if (event.key === "Backspace" && !digits[index] && index>0) inputs.current[index-1]?.focus(); if (event.key === "ArrowLeft" && index>0) inputs.current[index-1]?.focus(); if (event.key === "ArrowRight" && index<OTP_LENGTH-1) inputs.current[index+1]?.focus(); }
  function pasteCode(textValue:string) { const clean=textValue.replace(/\D/g, "").slice(0, OTP_LENGTH); if (!clean) return; setDigits(Array.from({length:OTP_LENGTH},(_,index)=>clean[index]??"")); inputs.current[Math.max(0,Math.min(clean.length,OTP_LENGTH)-1)]?.focus(); }

  async function verify(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!/^\d{6}$/.test(code)) return;
    setBusy(true); setStatus(""); const supabase=createClient();
    const { error } = await supabase.auth.verifyOtp({ email:pendingEmail, token:code, type:"email" });
    setBusy(false);
    if (error) return setStatus(document.documentElement.lang === "en" ? "The code is incorrect or expired. Request a new code." : document.documentElement.lang === "de" ? "Der Code ist falsch oder abgelaufen. Fordere einen neuen Code an." : "De code klopt niet of is verlopen. Vraag een nieuwe code aan.");
    setVerifyOpen(false); router.replace("/dashboard"); router.refresh();
  }

  async function resend() {
    if (busy || cooldown > 0 || !pendingEmail) return;
    setBusy(true); setStatus(""); const supabase=createClient();
    const { error } = await supabase.auth.resend({ type:"signup", email:pendingEmail, options:{ emailRedirectTo:`${window.location.origin}/auth/callback?next=/dashboard` } });
    setBusy(false);
    if (error) return setStatus(error.message);
    setDigits(Array(OTP_LENGTH).fill("")); setCooldown(60); setStatus(text.auth.codeSent); window.setTimeout(() => inputs.current[0]?.focus(),80);
  }

  return <>
    <div className="auth-card"><div className="auth-heading"><span>{text.auth.area}</span><h1>{text.auth.registerTitle}</h1><p>{text.auth.registerText}</p></div>
      <form className="auth-form" onSubmit={register}>
        <label>{text.auth.name}<input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required placeholder={text.auth.namePlaceholder} /></label>
        <label>{text.auth.email}<input name="email" type="email" autoComplete="email" required placeholder="naam@bedrijf.nl" /></label>
        <label>{text.auth.password}<span className="password-input"><input name="password" type={visible?"text":"password"} autoComplete="new-password" minLength={12} required value={password} onChange={(event)=>setPassword(event.target.value)} placeholder={text.auth.passwordPlaceholder} /><button type="button" onClick={()=>setVisible((value)=>!value)}>{visible?text.auth.hide:text.auth.show}</button></span></label>
        <div className="strength" data-score={strength.count}>
          <div className="strength-head"><span>{text.auth.strength}</span><strong>{strengthLabel}</strong></div><div className="strength-line"><span/><span/><span/><span/><span/></div>
          <div className="password-rules">{labels.map((label,index)=><span key={label} data-ok={checks[index]}><b>{checks[index]?"✓":"•"}</b>{label}</span>)}</div>
          {!strength.valid && password && <p className="strength-missing">{text.auth.need}: {labels.filter((_,index)=>!checks[index]).join(", ")}.</p>}
        </div>
        <label>{text.auth.passwordAgain}<span className="password-input"><input name="confirm" type={confirmVisible?"text":"password"} autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event)=>setConfirmPassword(event.target.value)} placeholder={text.auth.repeatPlaceholder} /><button type="button" onClick={()=>setConfirmVisible((value)=>!value)}>{confirmVisible?text.auth.hide:text.auth.show}</button></span>{confirmPassword && <small className={passwordsMatch?"match-ok":"match-bad"}>{passwordsMatch?`✓ ${text.auth.match}`:`✕ ${text.auth.noMatch}`}</small>}</label>
        <button className="button button-primary auth-submit" disabled={busy}>{busy?text.auth.creating:text.auth.makeAccount}</button>
      </form>
      <p className={`auth-status ${status?"show":""}`} aria-live="polite">{status}</p><p className="auth-switch">{text.auth.haveAccount} <Link href="/login">{text.auth.login}</Link></p>
    </div>

    {verifyOpen && <div className="modal-backdrop" role="presentation"><div className="verify-modal" role="dialog" aria-modal="true" aria-labelledby="verify-title">
      <div className="verify-topline"><div className="verify-icon">V</div><span className="verify-state"><i />{text.auth.codeSent}</span></div><span className="eyebrow">{text.auth.verifyEyebrow}</span><h2 id="verify-title">{text.auth.verifyTitle}</h2><p>{text.auth.verifyText} <strong>{pendingEmail}</strong>.</p>
      <form onSubmit={verify} className="verify-form"><div className="otp-boxes otp-six" onPaste={(event)=>{event.preventDefault();pasteCode(event.clipboardData.getData("text"));}}>{digits.map((digit,index)=><input key={index} ref={(node)=>{inputs.current[index]=node;}} aria-label={`OTP ${index+1}`} inputMode="numeric" pattern="[0-9]*" autoComplete={index===0?"one-time-code":"off"} maxLength={1} value={digit} onChange={(event)=>setDigit(index,event.target.value)} onKeyDown={(event)=>keyDown(index,event)} />)}</div><small className="otp-hint">{text.auth.codeHint}</small><button className="button button-primary verify-submit" disabled={busy || code.length!==OTP_LENGTH}>{busy?text.auth.verifying:text.auth.verifyButton}</button></form>
      <div className="verify-help"><button type="button" className="text-button" onClick={resend} disabled={busy || cooldown>0}>{cooldown>0?`${text.auth.resendIn} ${cooldown}s`:text.auth.resend}</button><button type="button" className="text-button" onClick={()=>{setVerifyOpen(false);setPendingEmail("");setDigits(Array(OTP_LENGTH).fill(""));}}>{text.auth.changeEmail}</button></div>
      <p className={`auth-status ${status?"show":""}`}>{status}</p>
    </div></div>}
  </>;
}
