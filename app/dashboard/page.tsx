import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";

export const metadata: Metadata = { title:"Dashboard", robots:{ index:false, follow:false } };
type ClientProject = { id:string; name:string; status:string; description:string|null; live_url:string|null; updated_at:string };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const [{ data:profile }, { data:projects }] = await Promise.all([
    supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle(),
    supabase.from("client_projects").select("id,name,status,description,live_url,updated_at").order("updated_at",{ascending:false}),
  ]);
  if (!profile) redirect("/auth/signout");
  const name = profile.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "daar";
  const email = profile.email || user.email || "—";
  return <DashboardClient name={name} email={email} projects={(projects ?? []) as ClientProject[]} />;
}
