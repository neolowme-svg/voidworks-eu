"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePreferences } from "@/components/preferences-provider";

function passwordState(value:string){const checks={length:value.length>=12,lower:/[a-z]/.test(value),upper:/[A-Z]/.test(value),number:/\d/.test(value),symbol:/[^A-Za-z0-9\s]/.test(value)};const count=Object.values(checks).filter(Boolean).length;return{checks,count,valid:count===5};}

export function ResetPasswordForm(){
  const { text }=usePreferences();
  const [token,setToken]=useState(""); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [visible,setVisible]=useState(false); const [status,setStatus]=useState(""); const [busy,setBusy]=useState(false); const [done,setDone]=useState(false);
  const strength=useMemo(()=>passwordState(password),[password]);
  const strengthLabel=!password?text.auth.empty:strength.count<=1?text.auth.weak:strength.count<=3?text.auth.fair:strength.count===4?text.auth.strong:text.auth.veryStrong;
  const labels=[...text.auth.rules]; const checks=[strength.checks.length,strength.checks.lower,strength.checks.upper,strength.checks.number,strength.checks.symbol];
  useEffect(()=>{const params=new URLSearchParams(window.location.hash.replace(/^#/,""));const value=params.get("token")||"";setToken(value);window.history.replaceState(null,"",window.location.pathname);},[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setStatus("");
    if(!token)return setStatus(text.auth.resetInvalid);
    if(!strength.valid)return setStatus(`${text.auth.need}: ${labels.filter((_,index)=>!checks[index]).join(", ")}.`);
    if(password!==confirm)return setStatus(text.auth.noMatch);
    setBusy(true);
    try{
      const response=await fetch("/api/auth/password-reset/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok){setStatus(result.error==="RATE_LIMIT"?text.auth.rateLimit:text.auth.resetInvalid);return;}
      setDone(true);setToken("");setPassword("");setConfirm("");setStatus(text.auth.resetSaved);
    }finally{setBusy(false);}
  }

  if(done)return <div className="reset-success"><p>{text.auth.resetSaved}</p><Link className="button button-primary" href="/login">{text.auth.login}</Link></div>;
  return <form className="auth-form" onSubmit={submit}>
    <label>{text.auth.password}<span className="password-input"><input type={visible?"text":"password"} autoComplete="new-password" minLength={12} required value={password} onChange={(e)=>setPassword(e.target.value)} /><button type="button" onClick={()=>setVisible(v=>!v)}>{visible?text.auth.hide:text.auth.show}</button></span></label>
    <div className="strength" data-score={strength.count}><div className="strength-head"><span>{text.auth.strength}</span><strong>{strengthLabel}</strong></div><div className="strength-line"><span/><span/><span/><span/><span/></div><div className="password-rules">{labels.map((label,index)=><span key={label} data-ok={checks[index]}><b>{checks[index]?"✓":"•"}</b>{label}</span>)}</div>{!strength.valid&&password&&<p className="strength-missing">{text.auth.need}: {labels.filter((_,index)=>!checks[index]).join(", ")}.</p>}</div>
    <label>{text.auth.passwordAgain}<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={(e)=>setConfirm(e.target.value)} />{confirm&&<small className={password===confirm?"match-ok":"match-bad"}>{password===confirm?`✓ ${text.auth.match}`:`✕ ${text.auth.noMatch}`}</small>}</label>
    <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy?text.auth.savingPassword:text.auth.savePassword}</button><p className={`auth-status ${status?"show":""}`} aria-live="polite">{status}</p>
  </form>;
}
