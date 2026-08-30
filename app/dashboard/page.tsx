import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { isAdminEmail } from "@/lib/security/admin";
import { validateAppSession } from "@/lib/security/session";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
type ClientProject = { id: string; name: string; status: string; description: string | null; live_url: string | null; updated_at: string };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  if (!(await validateAppSession(user.id))) redirect("/auth/signout?reason=session-expired");
  if (!user.email_confirmed_at || user.user_metadata?.voidworks_verification_required === true) {
    redirect(`/register?verify=${encodeURIComponent(user.email || "")}`);
  }

  let projects: ClientProject[] = [];
  try {
    const { data } = await supabase.from("client_projects").select("id,name,status,description,live_url,updated_at").order("updated_at", { ascending: false });
    projects = (data ?? []) as ClientProject[];
  } catch {
    projects = [];
  }

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "—";
  const email = user.email || "—";
  return <DashboardClient name={name} email={email} projects={projects} isAdmin={isAdminEmail(user.email)} />;
}
