"use client";
import Link from "next/link";
import { AdminBackups } from "@/components/admin-backups";
import { usePreferences } from "@/components/preferences-provider";

type Backup={name:string;created_at:string|null;size:number|null};
export function AdminPageContent({backups}:{backups:Backup[]}){const{text}=usePreferences();return <main className="page dashboard-page"><section className="dashboard-section"><div className="container dashboard-shell"><div className="dashboard-top"><div><span className="eyebrow">{text.admin.eyebrow}</span><h1>{text.admin.title}</h1><p>{text.admin.intro}</p></div><Link className="button button-secondary" href="/dashboard">{text.admin.back}</Link></div><AdminBackups backups={backups}/></div></section></main>}
