"use client";

import Link from "next/link";
import {FormEvent,KeyboardEvent,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {usePreferences} from "@/components/preferences-provider";
import {portalCopy} from "@/lib/portal-i18n";
import {getCsrfToken} from "@/lib/security/csrf-client";

type Action="change_profile"|"change_password"|"delete_account";
function strength(value:string){const checks=[value.length>=12,/[a-z]/.test(value),/[A-Z]/.test(value),/\d/.test(value),/[^A-Za-z0-9\s]/.test(value)];return{checks,score:checks.filter(Boolean).length,valid:checks.every(Boolean)}}

export function AccountSettings({email,initialName,initialUsername}:{email:string;initialName:string;initialUsername:string}){
  const{locale,text}=usePreferences();const t=portalCopy[locale].settings;const router=useRouter();
  const[name,setName]=useState(initialName);const[username,setUsername]=useState(initialUsername);
  const[oldPassword,setOldPassword]=useState("");const[password,setPassword]=useState("");const[repeat,setRepeat]=useState("");
  const[oldVisible,setOldVisible]=useState(false);const[newVisible,setNewVisible]=useState(false);const[repeatVisible,setRepeatVisible]=useState(false);
  const[status,setStatus]=useState("");const[busy,setBusy]=useState(false);const[action,setAction]=useState<Action|null>(null);const[digits,setDigits]=useState(Array(6).fill(""));
  const inputs=useRef<Array<HTMLInputElement|null>>([]);const pw=useMemo(()=>strength(password),[password]);
  const rules=locale==="nl"?["12+ tekens","kleine letter","hoofdletter","cijfer","speciaal teken"]:locale==="de"?["12+ Zeichen","Kleinbuchstabe","Großbuchstabe","Zahl","Sonderzeichen"]:["12+ characters","lowercase letter","uppercase letter","number","special character"];

  async function requestCode(next:Action){
    setBusy(true);setStatus("");
    try{const csrf=await getCsrfToken();const response=await fetch("/api/account/security/request",{method:"POST",headers:{"Content-Type":"application/json","x-voidworks-csrf":csrf},credentials:"same-origin",body:JSON.stringify({action:next,locale})});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error==="RATE_LIMIT"?text.auth.rateLimit:t.failed);setAction(next);setDigits(Array(6).fill(""));setTimeout(()=>inputs.current[0]?.focus(),80)}catch(e){setStatus(e instanceof Error?e.message:t.failed)}finally{setBusy(false)}
  }
  function digit(i:number,v:string){const x=v.replace(/\D/g,"").slice(-1);setDigits(cur=>{const n=[...cur];n[i]=x;return n});if(x&&i<5)inputs.current[i+1]?.focus()}
  function key(i:number,e:KeyboardEvent<HTMLInputElement>){if(e.key==="Backspace"&&!digits[i]&&i>0)inputs.current[i-1]?.focus()}
  function paste(v:string){const clean=v.replace(/\D/g,"").slice(0,6);setDigits(Array.from({length:6},(_,i)=>clean[i]||""));inputs.current[Math.max(0,Math.min(clean.length,6)-1)]?.focus()}

  async function confirm(e:FormEvent){
    e.preventDefault();if(!action)return;const code=digits.join("");if(!/^\d{6}$/.test(code)){setStatus(t.invalidCode);return}setBusy(true);setStatus("");
    try{
      const csrf=await getCsrfToken();const payload:Record<string,unknown>={action,code};
      if(action==="change_profile"){payload.fullName=name;payload.username=username}
      if(action==="change_password"){payload.oldPassword=oldPassword;payload.password=password}
      const response=await fetch("/api/account/security/confirm",{method:"POST",headers:{"Content-Type":"application/json","x-voidworks-csrf":csrf},credentials:"same-origin",body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));
      if(!response.ok){if(result.error==="USERNAME_TAKEN")throw new Error(t.usernameTaken);if(result.error==="CURRENT_PASSWORD_INVALID")throw new Error(t.currentPasswordIncorrect);if(result.error==="SAME_PASSWORD")throw new Error(t.samePassword);if(["INVALID_CODE","CODE_EXPIRED","CODE_LOCKED"].includes(result.error))throw new Error(t.invalidCode);throw new Error(t.failed)}
      setAction(null);setDigits(Array(6).fill(""));
      if(result.deleted){window.location.href="/register";return}
      if(result.logout){setStatus(t.passwordChanged);setOldPassword("");setPassword("");setRepeat("");window.setTimeout(()=>{window.location.href=`/login?email=${encodeURIComponent(email)}&reason=password-changed`},1100);return}
      setStatus(action==="change_profile"?t.profileSaved:t.saved);router.refresh();
    }catch(err){setStatus(err instanceof Error?err.message:t.failed)}finally{setBusy(false)}
  }

  function beginPasswordChange(){
    setStatus("");
    if(!oldPassword){setStatus(text.auth.loginFailed);return}
    if(password===oldPassword){setStatus(t.samePassword);return}
    if(!pw.valid){setStatus(`${text.auth.need}: ${rules.filter((_,i)=>!pw.checks[i]).join(", ")}.`);return}
    if(password!==repeat){setStatus(t.passwordMismatch);return}
    requestCode("change_password");
  }

  const eye=(visible:boolean,toggle:()=>void)=><button type="button" onClick={toggle}>{visible?text.auth.hide:text.auth.show}</button>;

  return <main className="page settings-page"><section className="section"><div className="container settings-shell">
    <div className="settings-heading"><div><span className="eyebrow">{text.dashboard.account}</span><h1>{t.title}</h1><p>{t.intro}</p></div><Link href="/dashboard" className="button button-secondary settings-back">← {t.back}</Link></div>

    <div className="settings-stack">
      <section className="settings-card settings-card-wide"><div className="settings-card-head"><div><span className="settings-step">01</span><h2>{t.profile}</h2></div><p>{email}</p></div><div className="settings-fields two"><label>{t.name}<input value={name} onChange={e=>setName(e.target.value)} maxLength={80}/></label><label>{t.username}<input value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g,""))} maxLength={30}/></label></div><div className="settings-actions"><button className="button button-primary" disabled={busy||name.trim().length<2||username.length<3||(name===initialName&&username===initialUsername)} onClick={()=>requestCode("change_profile")}>{t.saveProfile}</button></div></section>

      <section className="settings-card settings-card-wide"><div className="settings-card-head"><div><span className="settings-step">02</span><h2>{t.password}</h2></div><p>{locale==="nl"?"Je huidige wachtwoord is verplicht voor deze wijziging.":locale==="de"?"Für diese Änderung ist dein aktuelles Passwort erforderlich.":"Your current password is required for this change."}</p></div><div className="settings-fields">
        <label>{t.oldPassword}<span className="password-input"><input type={oldVisible?"text":"password"} value={oldPassword} onChange={e=>setOldPassword(e.target.value)} autoComplete="current-password"/>{eye(oldVisible,()=>setOldVisible(v=>!v))}</span></label>
        <div className="settings-fields two"><label>{t.newPassword}<span className="password-input"><input type={newVisible?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/>{eye(newVisible,()=>setNewVisible(v=>!v))}</span></label><label>{t.repeatPassword}<span className="password-input"><input type={repeatVisible?"text":"password"} value={repeat} onChange={e=>setRepeat(e.target.value)} autoComplete="new-password"/>{eye(repeatVisible,()=>setRepeatVisible(v=>!v))}</span></label></div>
        <div className="strength" data-score={pw.score}><div className="strength-line">{[0,1,2,3,4].map(i=><span key={i}/>)}</div><div className="password-rules">{rules.map((r,i)=><span key={r} data-ok={pw.checks[i]}>{pw.checks[i]?"✓":"○"} {r}</span>)}</div></div>
      </div><div className="settings-actions"><button className="button button-primary" disabled={busy||!oldPassword||!pw.valid||password!==repeat} onClick={beginPasswordChange}>{t.changePassword}</button></div></section>

      <section className="settings-card settings-card-wide danger-settings"><div className="settings-card-head"><div><span className="settings-step">03</span><h2>{t.delete}</h2></div></div><p>{t.deleteText}</p><div className="settings-actions"><button className="button danger-button solid" disabled={busy} onClick={()=>requestCode("delete_account")}>{t.deleteButton}</button></div></section>
    </div>
    <p className={`form-status settings-status ${status?"show":""}`} aria-live="polite">{status}</p>
  </div></section>

  {action&&<div className="modal-backdrop"><div className="verify-modal settings-code-modal" role="dialog" aria-modal="true"><img className="modal-logo-mark" src="/assets/voidworks-mark.png" alt="Voidworks"/><span className="eyebrow">{t.sendCode}</span><h2>{t.verifyTitle}</h2><p>{t.verifyText} <strong>{email}</strong>. {t.codeHint}</p><form onSubmit={confirm}><div className="otp-boxes otp-six" onPaste={e=>{e.preventDefault();paste(e.clipboardData.getData("text"))}}>{digits.map((d,i)=><input key={i} ref={n=>{inputs.current[i]=n}} value={d} inputMode="numeric" maxLength={1} aria-label={`Code ${i+1}`} onChange={e=>digit(i,e.target.value)} onKeyDown={e=>key(i,e)}/>)}</div><button className="button button-primary" disabled={busy||digits.join("").length!==6}>{t.confirm}</button></form><div className="modal-actions"><button className="button button-secondary" type="button" onClick={()=>setAction(null)}>{t.cancel}</button><button className="text-button" type="button" onClick={()=>requestCode(action)}>{t.resend}</button></div></div></div>}
  </main>
}
