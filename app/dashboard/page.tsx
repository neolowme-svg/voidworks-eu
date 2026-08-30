import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

type ClientProject = {
  id: string;
  name: string;
  status: string;
  description: string | null;
  live_url: string | null;
  updated_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("client_projects")
      .select("id,name,status,description,live_url,updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  const projectList = (projects ?? []) as ClientProject[];
  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "daar";

  return (
    <main className="page dashboard-page">
      <section className="dashboard-hero">
        <div className="container dashboard-heading" data-reveal>
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1>Hoi {displayName}.</h1>
            <p>Hier vind je de projecten die aan jouw account gekoppeld zijn.</p>
          </div>
          <SignOutButton />
        </div>
      </section>

      <section className="section dashboard-section">
        <div className="container">
          <div className="dashboard-topline" data-reveal>
            <h2>Projecten</h2>
            <span>{projectList.length}</span>
          </div>

          {projectList.length > 0 ? (
            <div className="dashboard-projects">
              {projectList.map((project) => (
                <article className="dashboard-project" key={project.id} data-reveal>
                  <div className="dashboard-project-head">
                    <div>
                      <span className="project-status">{project.status}</span>
                      <h3>{project.name}</h3>
                    </div>
                    <time dateTime={project.updated_at}>
                      {new Intl.DateTimeFormat("nl-NL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(project.updated_at))}
                    </time>
                  </div>
                  {project.description && <p>{project.description}</p>}
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noreferrer">
                      Open project ↗
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state" data-reveal>
              <h3>Nog geen project gekoppeld.</h3>
              <p>
                Zodra een project aan je account wordt toegevoegd, verschijnt
                het hier automatisch.
              </p>
              <a className="button button-primary" href="mailto:info@voidworks.eu">
                Contact opnemen
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
