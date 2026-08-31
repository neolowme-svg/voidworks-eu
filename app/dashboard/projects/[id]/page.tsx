import type {Metadata} from "next";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {validateAppSession} from "@/lib/security/session";
import {linkProjectRequestsToUser} from "@/lib/projects";
import {ProjectDetailClient} from "@/components/project-detail-client";
export const metadata:Metadata={title:"Project",robots:{index:false,follow:false}};
export default async function ProjectPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect(`/login?next=/dashboard/projects/${encodeURIComponent(id)}`);if(!(await validateAppSession(user.id)))redirect("/auth/signout?reason=session-expired");await linkProjectRequestsToUser(user);const{data:project}=await supabase.from("project_requests").select("*").eq("id",id).maybeSingle();if(!project)notFound();const{data:messages}=await supabase.from("project_messages").select("id,sender_role,sender_email,body,source,created_at").eq("project_id",id).order("created_at",{ascending:true});return <ProjectDetailClient project={project} messages={messages||[]}/>;}
