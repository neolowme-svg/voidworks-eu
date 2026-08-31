import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {requireAdminPage} from "@/lib/security/admin";
import {createAdminClient} from "@/lib/supabase/admin";
import {AdminProjectDetail} from "@/components/admin-project-detail";
export const metadata:Metadata={title:"Admin project",robots:{index:false,follow:false}};
export default async function AdminProjectPage({params}:{params:Promise<{id:string}>}){await requireAdminPage();const{id}=await params;const admin=createAdminClient();const[{data:project},{data:messages}]=await Promise.all([admin.from("project_requests").select("*").eq("id",id).maybeSingle(),admin.from("project_messages").select("id,sender_role,sender_email,body,source,created_at").eq("project_id",id).order("created_at",{ascending:true})]);if(!project)notFound();return <AdminProjectDetail project={project} messages={messages||[]}/>}
