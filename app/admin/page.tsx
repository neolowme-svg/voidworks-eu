import type {Metadata} from "next";
import {requireAdminPage} from "@/lib/security/admin";
import {createAdminClient} from "@/lib/supabase/admin";
import {BACKUP_BUCKET} from "@/lib/security/config";
import {AdminPageContent} from "@/components/admin-page-content";
export const metadata:Metadata={title:"Admin",robots:{index:false,follow:false}};
export default async function AdminPage(){await requireAdminPage();const admin=createAdminClient();const{data}=await admin.storage.from(BACKUP_BUCKET).list("",{limit:100,sortBy:{column:"created_at",order:"desc"}});const backups=(data||[]).filter(item=>item.name.endsWith(".sql")).map(item=>({name:item.name,created_at:item.created_at||null,size:typeof item.metadata?.size==="number"?item.metadata.size:null}));return <AdminPageContent backups={backups}/>}
