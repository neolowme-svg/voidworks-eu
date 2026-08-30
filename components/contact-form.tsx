"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { usePreferences } from "@/components/preferences-provider";
import { BotChallenge } from "@/components/bot-challenge";

type Status = { type:"idle"|"loading"|"success"|"error"; text:string };
type PricingDetail = { packageName:string; addons:string[]; once:number; monthly:number };

export function ContactForm() {
  const { text } = usePreferences();
  const [status,setStatus] = useState<Status>({ type:"idle", text:"" });
  const [type,setType] = useState<string>(text.contact.options[0]);
  const [prefill,setPrefill] = useState("");
  const [turnstileToken,setTurnstileToken] = useState("");
  const [challengeReady,setChallengeReady] = useState(false);
  const [challengeKey,setChallengeKey] = useState(0);
  const startedAt = useRef(Date.now());

  function resetChallenge(){setTurnstileToken("");setChallengeReady(false);setChallengeKey((value)=>value+1);startedAt.current=Date.now();}

  useEffect(() => { setType(text.contact.options[0]); }, [text.contact.options]);
  useEffect(() => {
    function fillFromPricing(event:Event){const detail=(event as CustomEvent<PricingDetail>).detail;if(!detail)return;setType(text.contact.options[1]);const addons=detail.addons.length?detail.addons.join(", "):"—";setPrefill(`${detail.packageName}. ${text.pricing.extras}: ${addons}. ${text.pricing.once}: €${detail.once}${detail.monthly?` + €${detail.monthly}${text.pricing.perMonth}`:""}.`);}
    window.addEventListener("voidworks-pricing-selection",fillFromPricing);return()=>window.removeEventListener("voidworks-pricing-selection",fillFromPricing);
  },[text]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!challengeReady){setStatus({type:"error",text:text.auth.securityWaiting});return;}
    const form=event.currentTarget;const data=new FormData(form);data.set("startedAt",String(startedAt.current));data.set("turnstileToken",turnstileToken);setStatus({type:"loading",text:text.contact.sending});
    try{
      const response=await fetch("/api/contact",{method:"POST",body:data,credentials:"same-origin"});const result=await response.json().catch(()=>({}));
      resetChallenge();
      if(!response.ok)throw new Error(result.error==="RATE_LIMIT"?text.auth.rateLimit:result.error==="BOT_CHECK_FAILED"?text.auth.botFailed:text.contact.error);
      form.reset();setPrefill("");setType(text.contact.options[0]);setStatus({type:"success",text:text.contact.success});
    }catch(error){resetChallenge();setStatus({type:"error",text:error instanceof Error?error.message:text.contact.error});}
  }

  const options=text.contact.options.map((label)=>({value:label,label}));
  return <form className="contact-form" onSubmit={submit}>
    <input className="honeypot" type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="field-row"><label>{text.contact.name}<input type="text" name="name" minLength={2} maxLength={80} autoComplete="name" required placeholder={text.contact.placeholderName}/></label><label>{text.contact.email}<input type="email" name="email" maxLength={160} autoComplete="email" required placeholder={text.contact.placeholderEmail}/></label></div>
    <label>{text.contact.subject}<CustomSelect name="type" value={type} onChange={setType} options={options} placeholder={text.contact.select}/></label>
    <label>{text.contact.message}<textarea name="message" minLength={10} maxLength={3000} rows={6} required placeholder={text.contact.placeholderMessage} value={prefill} onChange={(event)=>setPrefill(event.target.value)}/></label>
    <BotChallenge key={challengeKey} onToken={setTurnstileToken} onReady={setChallengeReady}/>
    {!challengeReady&&<small className="security-status">{text.auth.securityWaiting}</small>}
    <p className="form-consent">{text.contact.consent} <Link href="/privacy">{text.legal.privacy}</Link> · <Link href="/terms">{text.legal.terms}</Link></p>
    <button type="submit" className="button button-primary" disabled={status.type==="loading"||!challengeReady}>{status.type==="loading"?text.contact.sending:text.contact.send}</button>
    <p className={`form-status ${status.type}`} aria-live="polite">{status.text}</p>
  </form>;
}
