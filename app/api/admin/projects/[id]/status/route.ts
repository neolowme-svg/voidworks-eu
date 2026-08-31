import {NextResponse} from "next/server";
import {getAuthorizedAdmin} from "@/lib/security/admin-api";
import {createAdminClient} from "@/lib/supabase/admin";
import {requireCsrf} from "@/lib/security/csrf";
import {rejectCrossOrigin} from "@/lib/security/request";
const allowed=new Set(["requested","reviewing","accepted","building","waiting_for_client","ready","live","cancelled"]);
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const cross=rejectCrossOrigin(request);if(cross)return cross;if(!(await requireCsrf(request)))return NextResponse.json({error:"CSRF"},{status:403});const auth=await getAuthorizedAdmin();if(!auth)return NextResponse.json({error:"FORBIDDEN"},{status:403});const{id}=await params;const{status}=await request.json() as{status?:string};if(!allowed.has(String(status)))return NextResponse.json({error:"INVALID_STATUS"},{status:400});const admin=createAdminClient();const{error}=await admin.from("project_requests").update({status,updated_at:new Date().toISOString()}).eq("id",id);return error?NextResponse.json({error:"UPDATE_FAILED"},{status:500}):NextResponse.json({ok:true});}
