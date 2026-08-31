import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeAccountActionCode, type AccountAction } from "@/lib/security/account-actions";
import { requireCsrf } from "@/lib/security/csrf";
import { rejectCrossOrigin } from "@/lib/security/request";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { revokeCurrentAppSession, validateAppSession } from "@/lib/security/session";

const allowed=new Set<AccountAction>(["delete_account","change_password","change_profile"]);
const strong=(v:string)=>v.length>=12&&/[a-z]/.test(v)&&/[A-Z]/.test(v)&&/\d/.test(v)&&/[^A-Za-z0-9\s]/.test(v);
export async function POST(request:Request){
  const cross=rejectCrossOrigin(request);if(cross)return cross;if(!(await requireCsrf(request)))return NextResponse.json({error:"CSRF"},{status:403});
  try{const body=await request.json() as Record<string,unknown>;const action=String(body.action||"") as AccountAction;const code=String(body.code||"").trim();if(!allowed.has(action)||!/^\d{6}$/.test(code))return NextResponse.json({error:"INVALID_CODE"},{status:400});const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user||!(await validateAppSession(user.id)))return NextResponse.json({error:"NOT_AUTHENTICATED"},{status:401});if(!(await consumeRateLimit(`account-confirm:${user.id}:${action}`,10,900)))return NextResponse.json({error:"RATE_LIMIT"},{status:429});
    let fullName="",username="",password="";const admin=createAdminClient();
    if(action==="change_profile"){fullName=String(body.fullName||"").trim().slice(0,80);username=String(body.username||"").trim().toLowerCase().slice(0,30);if(fullName.length<2||!/^[-a-z0-9._]{3,30}$/.test(username))return NextResponse.json({error:"INVALID_INPUT"},{status:400});const{data:existing}=await admin.from("profiles").select("id").ilike("username",username).neq("id",user.id).limit(1);if(existing?.length)return NextResponse.json({error:"USERNAME_TAKEN"},{status:409});}
    if(action==="change_password"){password=String(body.password||"");if(!strong(password))return NextResponse.json({error:"WEAK_PASSWORD"},{status:400});}
    const result=await consumeAccountActionCode(user.id,action,code);if(result!=="ok")return NextResponse.json({error:result==="expired"?"CODE_EXPIRED":result==="locked"?"CODE_LOCKED":"INVALID_CODE"},{status:400});
    if(action==="change_profile"){const{error}=await admin.auth.admin.updateUserById(user.id,{user_metadata:{...(user.user_metadata||{}),full_name:fullName,username}});if(error)return NextResponse.json({error:"UPDATE_FAILED"},{status:500});const{error:profileError}=await admin.from("profiles").upsert({id:user.id,email:user.email||null,full_name:fullName,username,updated_at:new Date().toISOString()});if(profileError)return NextResponse.json({error:"UPDATE_FAILED"},{status:500});return NextResponse.json({ok:true});}
    if(action==="change_password"){const{error}=await admin.auth.admin.updateUserById(user.id,{password});if(error)return NextResponse.json({error:"UPDATE_FAILED"},{status:500});try { await admin.from("app_sessions").delete().eq("user_id",user.id); } catch {}await revokeCurrentAppSession();await supabase.auth.signOut({scope:"local"}).catch(()=>null);return NextResponse.json({ok:true,logout:true});}
    if(action==="delete_account"){const{error}=await admin.auth.admin.deleteUser(user.id);if(error)return NextResponse.json({error:"DELETE_FAILED"},{status:500});await revokeCurrentAppSession();await supabase.auth.signOut({scope:"local"}).catch(()=>null);return NextResponse.json({ok:true,deleted:true});}
    return NextResponse.json({error:"INVALID_ACTION"},{status:400});
  }catch(error){console.error(`[account/security/confirm] ${error instanceof Error?error.message.slice(0,200):"failed"}`);return NextResponse.json({error:"UPDATE_FAILED"},{status:500});}
}
