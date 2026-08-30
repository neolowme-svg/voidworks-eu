"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/components/preferences-provider";
import { SignOutButton } from "@/components/sign-out-button";

type ClientProject = { id:string; name:string; status:string; description:string|null; live_url:string|null; updated_at:string };

export function DashboardClient({ name, email, projects }: { name:string; email:string; projects:ClientProject[] }) {
  const { locale, text } = usePreferences();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function removeAccount() {
    setDeleting(true); setDeleteError("");
    try {
      const response = await fetch("/api/account/delete", { method:"DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Delete failed");
      const supabase = createClient();
      await supabase.auth.signOut({ scope:"local" });
      router.replace("/register");
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Delete failed");
      setDeleting(false);
    }
  }

  const formatDate = (value:string) => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale === "de" ? "de-DE" : "nl-NL", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(value));

  return <main className="page dashboard-page"><section className="dashboard-section"><div className="container dashboard-shell">
    <div className="dashboard-top"><div><span className="eyebrow">{text.dashboard.eyebrow}</span><h1>{text.dashboard.welcome}, {name}.</h1><p>{text.dashboard.intro}</p></div><SignOutButton /></div>
    <div className="dashboard-stats"><article><span>{text.dashboard.projects}</span><strong>{projects.length}</strong><small>{text.dashboard.linked}</small></article><article><span>{text.dashboard.email}</span><strong className="dashboard-email">{email}</strong><small>{text.dashboard.confirmed}</small></article><article><span>{text.dashboard.status}</span><strong className="status-online"><i/>{text.dashboard.active}</strong><small>{text.dashboard.secure}</small></article></div>
    <div className="dashboard-grid"><section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">{text.dashboard.projects}</span><h2>{text.dashboard.yourProjects}</h2></div><span className="count-pill">{projects.length}</span></div>
      {projects.length ? <div className="dashboard-projects">{projects.map((project) => <article className="dashboard-project" key={project.id}><div className="dashboard-project-head"><div><span className="project-status">{project.status}</span><h3>{project.name}</h3></div><time>{formatDate(project.updated_at)}</time></div>{project.description && <p>{project.description}</p>}{project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer">Open project ↗</a>}</article>)}</div>
      : <div className="dashboard-empty"><div className="dashboard-empty-icon">V</div><h3>{text.dashboard.noProject}</h3><p>{text.dashboard.noProjectText}</p><Link className="button button-primary" href="/#contact">{text.dashboard.start}</Link></div>}
    </section>
    <aside className="dashboard-panel account-panel"><span className="eyebrow">{text.dashboard.account}</span><h2>{text.dashboard.accountDetails}</h2><div className="account-list"><div><span>{text.dashboard.name}</span><strong>{name}</strong></div><div><span>{text.dashboard.email}</span><strong>{email}</strong></div><div><span>{text.dashboard.verification}</span><strong className="verified-state"><i/>{text.dashboard.verified}</strong></div></div><a className="button button-secondary" href="mailto:info@voidworks.eu">{text.dashboard.contact}</a><button className="button danger-button" type="button" onClick={() => setDeleteOpen(true)}>{text.dashboard.delete}</button></aside>
    </div>
  </div></section>

  {deleteOpen && <div className="modal-backdrop" role="presentation"><div className="verify-modal delete-modal" role="dialog" aria-modal="true"><span className="eyebrow">{text.dashboard.account}</span><h2>{text.dashboard.deleteTitle}</h2><p>{text.dashboard.deleteText}</p>{deleteError && <p className="delete-error">{deleteError}</p>}<div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setDeleteOpen(false)} disabled={deleting}>{text.dashboard.cancel}</button><button className="button danger-button solid" type="button" onClick={removeAccount} disabled={deleting}>{deleting?text.dashboard.deleting:text.dashboard.deleteConfirm}</button></div></div></div>}
  </main>;
}
