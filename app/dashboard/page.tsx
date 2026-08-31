import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {DashboardClient} from "@/components/dashboard-client";
import {isAdminEmail} from "@/lib/security/admin";
import {validateAppSession} from "@/lib/security/session";
import {linkProjectRequestsToUser} from "@/lib/projects";
export const metadata:Metadata={title:"Dashboard",robots:{index:false,follow:false}};
export default async function DashboardPage(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=/dashboard");if(!(await validateAppSession(user.id)))redirect("/auth/signout?reason=session-expired");if(!user.email_confirmed_at||user.user_metadata?.voidworks_verification_required===true)redirect(`/register?verify=${encodeURIComponent(user.email||"")}`);await linkProjectRequestsToUser(user);const[{data:projects},{data:profile}]=await Promise.all([supabase.from("project_requests").select("id,request_code,company_name,package_id,status,one_time_total,monthly_total,live_url,created_at,updated_at").order("updated_at",{ascending:false}),supabase.from("profiles").select("full_name,username").eq("id",user.id).maybeSingle()]);const name=profile?.full_name||user.user_metadata?.full_name||user.email?.split("@")[0]||"—";return <DashboardClient name={name} username={profile?.username||user.user_metadata?.username||""} email={user.email||"—"} projects={projects||[]} isAdmin={isAdminEmail(user.email)}/>}
