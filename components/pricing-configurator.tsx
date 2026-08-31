"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/components/preferences-provider";
import { portalCopy } from "@/lib/portal-i18n";
import { addons, availableAddons, calculateProjectPrice, packages, type AddonId, type PackageId } from "@/lib/project-catalog";

export function PricingConfigurator(){
  const {locale,text}=usePreferences();
  const t=portalCopy[locale].pricing;
  const router=useRouter();
  const [selectedPackage,setSelectedPackage]=useState<PackageId|null>(null);
  const [selectedAddons,setSelectedAddons]=useState<AddonId[]>([]);
  const pack=packages.find(item=>item.id===selectedPackage)??null;
  const available=pack?availableAddons(pack.id):[];
  const totals=useMemo(()=>pack?calculateProjectPrice(pack.id,selectedAddons):{once:0,monthly:0},[pack,selectedAddons]);
  const euros=(value:number)=>new Intl.NumberFormat(locale==="en"?"en-IE":locale==="de"?"de-DE":"nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(value);
  function open(id:PackageId){setSelectedPackage(id);setSelectedAddons([]);}
  function toggle(id:AddonId){setSelectedAddons(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
  function proceed(){if(!pack)return;const query=selectedAddons.length?`?addons=${encodeURIComponent(selectedAddons.join(","))}`:"";router.push(`/project-request/${pack.slug}${query}`);}
  return <>
    <div className="pricing-grid pricing-packages-only">
      {packages.map(item=><article className={`pricing-card ${item.popular?"featured":""}`} key={item.id}>
        <div className="pricing-card-top"><span>{item.names[locale]}</span>{item.popular&&<b>{text.pricing.popular}</b>}</div>
        <strong>{text.pricing.from} {euros(item.price)}</strong>
        <p>{item.descriptions[locale]}</p>
        <ul>{item.features[locale].map(feature=><li key={feature}>{feature}</li>)}</ul>
        <button className="button button-primary pricing-select" type="button" onClick={()=>open(item.id)}>{t.choose}</button>
      </article>)}
    </div>
    {pack&&<div className="modal-backdrop package-modal-backdrop" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelectedPackage(null);}}>
      <div className="package-modal" role="dialog" aria-modal="true" aria-labelledby="package-modal-title">
        <div className="package-modal-head"><div><span className="eyebrow">{t.configure}</span><h2 id="package-modal-title">{pack.names[locale]}</h2><p>{pack.descriptions[locale]}</p></div><button className="modal-close" type="button" onClick={()=>setSelectedPackage(null)} aria-label={t.close}>×</button></div>
        <div className="package-addon-list">
          {available.map(addon=>{const included=addon.included?.includes(pack.id)??false;const price=addon.prices[pack.id]??0;const checked=included||selectedAddons.includes(addon.id);return <button type="button" key={addon.id} className={`package-addon ${checked?"selected":""} ${included?"included":""}`} onClick={()=>!included&&toggle(addon.id)} aria-pressed={checked}>
            <span className="custom-check" aria-hidden="true">{checked?"✓":""}</span><span className="package-addon-copy"><strong>{addon.names[locale]}</strong><small>{addon.descriptions[locale]}</small></span><b>{included?t.included:`+ ${euros(price)}${addon.monthly?` ${t.monthly}`:""}`}</b>
          </button>})}
        </div>
        <div className="package-modal-summary"><div><span>{t.summary}</span><strong>{euros(totals.once)}{totals.monthly>0&&<small> + {euros(totals.monthly)} {t.monthly}</small>}</strong></div><button className="button button-primary" type="button" onClick={proceed}>{t.continue}</button></div>
      </div>
    </div>}
  </>;
}
