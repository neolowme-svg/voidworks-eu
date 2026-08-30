"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePreferences } from "@/components/preferences-provider";
import { getCsrfToken } from "@/lib/security/csrf-client";

type Backup = { name:string; created_at:string|null; size:number|null };

export function AdminBackups({ backups }: { backups:Backup[] }) {
  const { text, locale } = usePreferences();
  const router = useRouter();
  const [busy,setBusy]=useState("");
  const [status,setStatus]=useState("");
  const fmt = new Intl.DateTimeFormat(locale==="en"?"en-GB":locale==="de"?"de-DE":"nl-NL", { dateStyle:"medium", timeStyle:"short" });

  async function create(){setBusy("create");setStatus("");try{const csrf=await getCsrfToken();const r=await fetch("/api/admin/backups/create",{method:"POST",headers:{"x-voidworks-csrf":csrf}});const j=await r.json().catch(()=>({}));setStatus(r.ok?text.admin.backupStarted:(j.error==="BACKUP_NOT_CONFIGURED"?text.admin.configured:text.admin.backupFailed));}finally{setBusy("");}}
  async function remove(name:string){setBusy(name);setStatus("");try{const csrf=await getCsrfToken();const r=await fetch("/api/admin/backups/delete",{method:"DELETE",headers:{"Content-Type":"application/json","x-voidworks-csrf":csrf},body:JSON.stringify({name})});if(r.ok)router.refresh();else setStatus(text.admin.deleteFailed);}finally{setBusy("");}}
  function bytes(value:number|null){if(!value)return "—";if(value<1024*1024)return `${Math.round(value/1024)} KB`;return `${(value/1024/1024).toFixed(1)} MB`;}

  return <section className="dashboard-panel backup-panel"><div className="panel-heading"><div><span className="eyebrow">{text.admin.backups}</span><h2>{text.admin.backups}</h2></div><button className="button button-primary" type="button" onClick={create} disabled={!!busy}>{busy==="create"?text.admin.creating:text.admin.create}</button></div><p className="backup-intro">{text.admin.backupIntro}</p>
    {backups.length?<div className="backup-list">{backups.map((backup)=><article key={backup.name}><div><strong>{backup.name}</strong><span>{backup.created_at?fmt.format(new Date(backup.created_at)):"—"} · {bytes(backup.size)}</span></div><div className="backup-actions"><a className="button button-secondary" href={`/api/admin/backups/download?name=${encodeURIComponent(backup.name)}`}>{text.admin.download}</a><button className="button danger-button" type="button" disabled={busy===backup.name} onClick={()=>remove(backup.name)}>{text.admin.remove}</button></div></article>)}</div>:<p className="dashboard-empty-copy">{text.admin.empty}</p>}
    {status&&<p className="auth-status show" aria-live="polite">{status}</p>}<button className="text-button" type="button" onClick={()=>router.refresh()}>{text.admin.refresh}</button>
  </section>;
}
