"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/components/preferences-provider";

function passwordState(value:string){const checks={length:value.length>=12,lower:/[a-z]/.test(value),upper:/[A-Z]/.test(value),number:/\d/.test(value),symbol:/[^A-Za-z0-9\s]/.test(value)};const count=Object.values(checks).filter(Boolean).length;return{checks,count,valid:count===5};}

export function ResetPasswordForm(){
  const router=useRouter(); const { locale,text }=usePreferences(); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [visible,setVisible]=useState(false); const [status,setStatus]=useState(""); const [busy,setBusy]=useState(false); const strength=useMemo(()=>passwordState(password),[password]);
  const strengthLabel=!password?text.auth.empty:strength.count<=1?text.auth.weak:strength.count<=3?text.auth.fair:strength.count===4?text.auth.strong:text.auth.veryStrong;
  const labels=[text.auth.rules[0],text.auth.rules[1],text.auth.rules[2],text.auth.rules[3],text.auth.rules[4]]; const checks=[strength.checks.length,strength.checks.lower,strength.checks.upper,strength.checks.number,strength.checks.symbol];
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setStatus("");if(!strength.valid)return setStatus(locale==="en"?"Your password does not meet all requirements.":locale==="de"?"Dein Passwort erfüllt noch nicht alle Anforderungen.":"Je wachtwoord voldoet nog niet aan alle eisen.");if(password!==confirm)return setStatus(text.auth.noMatch);setBusy(true);const supabase=createClient();const {error}=await supabase.auth.updateUser({password});setBusy(false);if(error)return setStatus(locale==="en"?"Could not change password. Open the reset link again.":locale==="de"?"Passwort konnte nicht geändert werden. Öffne den Reset-Link erneut.":"Wachtwoord wijzigen is niet gelukt. Open de resetlink uit je mail opnieuw.");router.replace("/dashboard");router.refresh();}
  return <form className="auth-form" onSubmit={submit}><label>{locale==="en"?"New password":locale==="de"?"Neues Passwort":"Nieuw wachtwoord"}<span className="password-input"><input type={visible?"text":"password"} autoComplete="new-password" minLength={12} required value={password} onChange={(e)=>setPassword(e.target.value)} /><button type="button" onClick={()=>setVisible(v=>!v)}>{visible?text.auth.hide:text.auth.show}</button></span></label>
    <div className="strength" data-score={strength.count}><div className="strength-head"><span>{text.auth.strength}</span><strong>{strengthLabel}</strong></div><div className="strength-line"><span/><span/><span/><span/><span/></div><div className="password-rules">{labels.map((label,index)=><span key={label} data-ok={checks[index]}><b>{checks[index]?"✓":"•"}</b>{label}</span>)}</div></div>
    <label>{text.auth.passwordAgain}<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={(e)=>setConfirm(e.target.value)} />{confirm&&<small className={password===confirm?"match-ok":"match-bad"}>{password===confirm?`✓ ${text.auth.match}`:`✕ ${text.auth.noMatch}`}</small>}</label>
    <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy?(locale==="en"?"Saving...":locale==="de"?"Speichern...":"Opslaan..."):(locale==="en"?"Save new password":locale==="de"?"Neues Passwort speichern":"Nieuw wachtwoord opslaan")}</button><p className={`auth-status ${status?"show":""}`} aria-live="polite">{status}</p></form>;
}
