"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { BotChallenge } from "@/components/bot-challenge";
import { usePreferences } from "@/components/preferences-provider";
import { portalCopy } from "@/lib/portal-i18n";
import { availableAddons, calculateProjectPrice, packages, type AddonId, type PackageId } from "@/lib/project-catalog";

export function ProjectRequestForm({packageId,initialAddons,initialEmail,initialName}:{packageId:PackageId;initialAddons:string[];initialEmail:string;initialName:string}){
  const {locale,text}=usePreferences(); const t=portalCopy[locale].request;
  const pack=packages.find(item=>item.id===packageId)!;
  const allowed=availableAddons(packageId);
  const [selected,setSelected]=useState<AddonId[]>(()=>initialAddons.filter(id=>allowed.some(a=>a.id===id)) as AddonId[]);
  const [busy,setBusy]=useState(false); const [status,setStatus]=useState(""); const [done,setDone]=useState<{id:string;code:string;email:string;emailSent:boolean}|null>(null);
  const [turnstileToken,setTurnstileToken]=useState(""); const [challengeReady,setChallengeReady]=useState(false); const [challengeKey,setChallengeKey]=useState(0); const startedAt=useRef(Date.now());
  const totals=useMemo(()=>calculateProjectPrice(packageId,selected),[packageId,selected]);
  const euros=(value:number)=>new Intl.NumberFormat(locale==="en"?"en-IE":locale==="de"?"de-DE":"nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(value);
  const resetChallenge=()=>{setTurnstileToken("");setChallengeReady(false);setChallengeKey(v=>v+1);startedAt.current=Date.now();};
  const toggle=(id:AddonId)=>setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setStatus(""); if(!challengeReady){setStatus(t.security);return;} setBusy(true);
    const data=new FormData(event.currentTarget); const email=String(data.get("requesterEmail")||"").trim().toLowerCase();
    const payload={requesterName:data.get("requesterName"),requesterEmail:email,companyName:data.get("companyName"),companyDescription:data.get("companyDescription"),siteType:data.get("siteType"),siteRequirements:data.get("siteRequirements"),styleReference:data.get("styleReference"),packageId,selectedAddons:selected,locale,turnstileToken,startedAt:startedAt.current,companyWebsite:data.get("companyWebsite")};
    try{const response=await fetch("/api/projects/request",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));resetChallenge();if(!response.ok){setStatus(result.error==="BOT_CHECK_FAILED"?text.auth.botFailed:result.error==="SECURITY_UNAVAILABLE"?text.auth.securityUnavailable:result.error==="RATE_LIMIT"?text.auth.rateLimit:result.error==="INVALID_INPUT"?t.invalid:t.failed);return;}setDone({id:String(result.id),code:String(result.requestCode),email,emailSent:result.emailSent!==false});}
    catch{resetChallenge();setStatus(t.failed);}finally{setBusy(false);}
  }
  if(done)return <main className="page project-request-page"><section className="section"><div className="container request-success-shell"><div className="success-logo"><img src="/assets/voidworks-mark.png" alt="Voidworks"/></div><span className="eyebrow">{t.eyebrow}</span><h1>{t.successTitle}</h1><p>{t.successText}</p><div className="request-code-card"><span>{portalCopy[locale].projects.requestId}</span><strong>{done.code}</strong></div>{!done.emailSent&&<p className="form-status error">{text.auth.emailUnavailable}</p>}<div className="request-success-actions"><Link className="button button-primary" href="/dashboard">{t.dashboard}</Link><Link className="button button-secondary" href={`/register?email=${encodeURIComponent(done.email)}`}>{t.register}</Link></div></div></section></main>;
  return <main className="page project-request-page"><section className="section"><div className="container project-request-layout">
    <form className="project-request-form" onSubmit={submit}>
      <div className="request-heading"><span className="eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.intro}</p></div>
      <input className="honeypot" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
      <div className="field-row"><label>{t.name}<input name="requesterName" required minLength={2} maxLength={80} defaultValue={initialName} autoComplete="name"/></label><label>{t.email}<input name="requesterEmail" required type="email" maxLength={160} defaultValue={initialEmail} autoComplete="email"/></label></div>
      <label>{t.company}<input name="companyName" required minLength={2} maxLength={120} placeholder={t.companyPlaceholder}/></label>
      <label>{t.companyDoes}<textarea name="companyDescription" required minLength={10} maxLength={4000} rows={5} placeholder={t.companyDoesPlaceholder}/></label>
      <label>{t.siteType}<input name="siteType" required minLength={2} maxLength={160} placeholder={t.siteTypePlaceholder}/></label>
      <label>{t.requirements}<textarea name="siteRequirements" required minLength={10} maxLength={8000} rows={8} placeholder={t.requirementsPlaceholder}/></label>
      <label>{t.style}<textarea name="styleReference" maxLength={3000} rows={5} placeholder={t.stylePlaceholder}/></label>
      <BotChallenge key={challengeKey} action="project_request" onToken={setTurnstileToken} onReady={setChallengeReady}/>{!challengeReady&&<small className="security-status">{text.auth.securityWaiting}</small>}
      <p className="form-consent">{t.terms} <Link href="/terms">{text.legal.terms}</Link> · <Link href="/privacy">{text.legal.privacy}</Link></p>
      <button className="button button-primary request-submit" type="submit" disabled={busy||!challengeReady}>{busy?t.submitting:t.submit}</button><p className={`form-status ${status?"error":""}`} aria-live="polite">{status}</p>
    </form>
    <aside className="request-summary-card"><span className="eyebrow">{t.price}</span><h2>{pack.names[locale]}</h2><strong className="request-base-price">{euros(pack.price)}</strong><p>{pack.descriptions[locale]}</p><div className="request-addon-picker"><h3>{t.addons}</h3>{allowed.map(addon=>{const included=addon.included?.includes(packageId)??false;const checked=included||selected.includes(addon.id);return <button type="button" className={`package-addon ${checked?"selected":""}`} key={addon.id} onClick={()=>!included&&toggle(addon.id)}><span className="custom-check">{checked?"✓":""}</span><span className="package-addon-copy"><strong>{addon.names[locale]}</strong><small>{addon.descriptions[locale]}</small></span><b>{included?portalCopy[locale].pricing.included:`+ ${euros(addon.prices[packageId]||0)}${addon.monthly?` ${portalCopy[locale].pricing.monthly}`:""}`}</b></button>})}</div><div className="request-total"><span>{text.pricing.once}</span><strong>{euros(totals.once)}</strong>{totals.monthly>0&&<small>+ {euros(totals.monthly)} {text.pricing.perMonth}</small>}</div><Link className="text-link" href="/#prijzen">← {t.back}</Link></aside>
  </div></section></main>;
}
