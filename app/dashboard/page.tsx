import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient } from "@/components/dashboard-client";
import { isAdminEmail } from "@/lib/security/admin";
import { validateAppSession } from "@/lib/security/session";

export const metadata: Metadata = { title:"Dashboard", robots:{ index:false, follow:false } };
type ClientProject = { id:string; name:string; status:string; description:string|null; live_url:string|null; updated_at:string };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  if (!(await validateAppSession(user.id))) redirect("/auth/signout?reason=session-expired");

  const admin = createAdminClient();
  let { data: profile } = await admin.from("profiles").select("full_name,email,email_verified_at").eq("id", user.id).maybeSingle();
  if (!profile) {
    const needsVerification = user.user_metadata?.voidworks_verification_required === true;
    const { data } = await admin.from("profiles").upsert({
      id:user.id, email:user.email || null, full_name:user.user_metadata?.full_name || "",
      email_verified_at:needsVerification ? null : (user.email_confirmed_at || new Date().toISOString()), updated_at:new Date().toISOString(),
    }).select("full_name,email,email_verified_at").single();
    profile = data;
  }
  if (profile && !profile.email_verified_at && user.email_confirmed_at && user.user_metadata?.voidworks_verification_required !== true) {
    const verifiedAt = user.email_confirmed_at;
    await admin.from("profiles").update({ email_verified_at: verifiedAt, updated_at:new Date().toISOString() }).eq("id", user.id);
    profile = { ...profile, email_verified_at: verifiedAt };
  }
  if (!profile?.email_verified_at) redirect(`/register?verify=${encodeURIComponent(user.email || "")}`);

  const { data:projects } = await supabase.from("client_projects").select("id,name,status,description,live_url,updated_at").order("updated_at",{ascending:false});
  const name = profile.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "—";
  const email = profile.email || user.email || "—";
  return <DashboardClient name={name} email={email} projects={(projects ?? []) as ClientProject[]} isAdmin={isAdminEmail(user.email)} />;
}
