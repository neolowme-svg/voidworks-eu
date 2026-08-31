import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {validateAppSession} from "@/lib/security/session";
import {AccountSettings} from "@/components/account-settings";
export const metadata:Metadata={title:"Account settings",robots:{index:false,follow:false}};
export default async function AccountSettingsPage(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=/account/settings");if(!(await validateAppSession(user.id)))redirect("/auth/signout?reason=session-expired");const{data:profile}=await supabase.from("profiles").select("full_name,username").eq("id",user.id).maybeSingle();return <AccountSettings email={user.email||""} initialName={profile?.full_name||user.user_metadata?.full_name||""} initialUsername={profile?.username||user.user_metadata?.username||""}/>;}
