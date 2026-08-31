import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPackageBySlug } from "@/lib/project-catalog";
import { ProjectRequestForm } from "@/components/project-request-form";

export const metadata:Metadata={title:"Project request",robots:{index:false,follow:false}};

export default async function ProjectRequestPage({params,searchParams}:{params:Promise<{package:string}>;searchParams:Promise<{addons?:string}>}){
  const {package:slug}=await params;
  const query=await searchParams;
  const pack=getPackageBySlug(slug); if(!pack)notFound();
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const initialAddons=String(query.addons||"").split(",").filter(Boolean);
  return <ProjectRequestForm packageId={pack.id} initialAddons={initialAddons} initialEmail={user?.email||""} initialName={String(user?.user_metadata?.full_name||"")}/>;
}
