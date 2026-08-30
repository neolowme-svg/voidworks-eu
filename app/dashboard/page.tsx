import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
type ClientProject = { id:string; name:string; status:string; description:string|null; live_url:string|null; updated_at:string };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle(),
    supabase.from("client_projects").select("id,name,status,description,live_url,updated_at").order("updated_at", { ascending:false }),
  ]);
  if (!profile) redirect("/auth/signout");
  const list = (projects ?? []) as ClientProject[];
  const name = profile.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "daar";
  const email = profile.email || user.email || "—";

  return <main className="page dashboard-page"><section className="dashboard-section"><div className="container dashboard-shell">
    <div className="dashboard-top"><div><span className="eyebrow">Dashboard</span><h1>Welkom terug, {name}.</h1><p>Hier vind je je projecten, status en accountgegevens.</p></div><SignOutButton /></div>
    <div className="dashboard-stats"><article><span>Projecten</span><strong>{list.length}</strong><small>Aan je account gekoppeld</small></article><article><span>E-mail</span><strong className="dashboard-email">{email}</strong><small>Bevestigd account</small></article><article><span>Status</span><strong className="status-online"><i/>Actief</strong><small>Beveiligde klantomgeving</small></article></div>
    <div className="dashboard-grid"><section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">Projecten</span><h2>Jouw projecten</h2></div><span className="count-pill">{list.length}</span></div>
      {list.length ? <div className="dashboard-projects">{list.map(project => <article className="dashboard-project" key={project.id}><div className="dashboard-project-head"><div><span className="project-status">{project.status}</span><h3>{project.name}</h3></div><time>{new Intl.DateTimeFormat("nl-NL",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(project.updated_at))}</time></div>{project.description && <p>{project.description}</p>}{project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer">Open project ↗</a>}</article>)}</div> : <div className="dashboard-empty"><div className="dashboard-empty-icon">V</div><h3>Nog geen project gekoppeld.</h3><p>Zodra we een project aan je account koppelen, verschijnt het hier automatisch.</p><Link className="button button-primary" href="/#contact">Project starten</Link></div>}
    </section><aside className="dashboard-panel account-panel"><span className="eyebrow">Account</span><h2>Accountgegevens</h2><div className="account-list"><div><span>Naam</span><strong>{name}</strong></div><div><span>E-mail</span><strong>{email}</strong></div><div><span>Verificatie</span><strong className="verified-state"><i/>Bevestigd</strong></div></div><a className="button button-secondary" href="mailto:info@voidworks.eu">Contact opnemen</a></aside></div>
  </div></section></main>;
}
