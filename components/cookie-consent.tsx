"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePreferences } from "@/components/preferences-provider";

export function CookieConsent(){
  const{consent,setConsent,text}=usePreferences();
  const[forced,setForced]=useState(false);
  useEffect(()=>{const open=()=>setForced(true);window.addEventListener("voidworks-cookie-settings",open);return()=>window.removeEventListener("voidworks-cookie-settings",open);},[]);
  if(consent!=="unset"&&!forced)return null;
  return <div className="cookie-banner" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
    <div><strong id="cookie-title">{text.cookie.title}</strong><p>{text.cookie.text} <Link href="/cookies">{text.legal.cookies}</Link> · <Link href="/privacy">{text.legal.privacy}</Link></p></div>
    <div className="cookie-actions"><button className="button button-secondary" type="button" onClick={()=>{setConsent("essential");setForced(false);}}>{text.cookie.essential}</button><button className="button button-primary" type="button" onClick={()=>{setConsent("preferences");setForced(false);}}>{text.cookie.preferences}</button></div>
  </div>;
}
