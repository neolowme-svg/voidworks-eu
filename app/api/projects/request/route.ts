import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { availableAddons, calculateProjectPrice, packages, type PackageId } from "@/lib/project-catalog";
import { sendProjectRequestEmails } from "@/lib/email/resend";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, isLikelyBotTrap, rejectCrossOrigin, validFormAge } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(value:unknown,max:number)=>String(value||"").trim().slice(0,max);

export async function POST(request:Request){
  const cross=rejectCrossOrigin(request); if(cross)return cross;
  try{
    const body=await request.json() as Record<string,unknown>;
    if(isLikelyBotTrap(body.companyWebsite)||!validFormAge(body.startedAt)) return NextResponse.json({error:"INVALID_FORM"},{status:400});
    const requesterName=clean(body.requesterName,80);
    const requesterEmail=clean(body.requesterEmail,160).toLowerCase();
    const companyName=clean(body.companyName,120);
    const companyDescription=clean(body.companyDescription,4000);
    const siteType=clean(body.siteType,160);
    const siteRequirements=clean(body.siteRequirements,8000);
    const styleReference=clean(body.styleReference,3000);
    const locale=body.locale==="nl"||body.locale==="de"?body.locale:"en";
    const packageId=clean(body.packageId,30) as PackageId;
    const pack=packages.find(item=>item.id===packageId);
    if(!pack||requesterName.length<2||!emailPattern.test(requesterEmail)||companyName.length<2||companyDescription.length<10||siteType.length<2||siteRequirements.length<10){
      return NextResponse.json({error:"INVALID_INPUT"},{status:400});
    }
    const allowedIds = new Set<string>(availableAddons(packageId).map(item => item.id));
    const selectedAddons = Array.isArray(body.selectedAddons)
      ? body.selectedAddons.map(String).filter((id): id is string => allowedIds.has(id)).slice(0, 20)
      : [];
    const turnstile=await verifyTurnstile(clean(body.turnstileToken,3000),"project_request");
    if(!turnstile.ok)return NextResponse.json({error:turnstile.unavailable?"SECURITY_UNAVAILABLE":"BOT_CHECK_FAILED"},{status:turnstile.unavailable?503:403});
    const ip=getClientIp(request);
    if(!(await consumeRateLimit(`project-request:ip:${ip}`,8,3600))||!(await consumeRateLimit(`project-request:email:${requesterEmail}`,6,3600))) return NextResponse.json({error:"RATE_LIMIT"},{status:429});

    const supabase=await createClient();
    const {data:{user}}=await supabase.auth.getUser();
    const userId=user?.email?.toLowerCase()===requesterEmail?user.id:null;
    const totals=calculateProjectPrice(packageId,selectedAddons);
    const admin=createAdminClient();
    const requestCode=`VW-${randomBytes(5).toString("hex").toUpperCase()}`;
    const {data:project,error}=await admin.from("project_requests").insert({
      request_code:requestCode,user_id:userId,requester_name:requesterName,requester_email:requesterEmail,company_name:companyName,
      company_description:companyDescription,package_id:packageId,site_type:siteType,site_requirements:siteRequirements,
      style_reference:styleReference||null,selected_addons:selectedAddons,base_price:pack.price,one_time_total:totals.once,monthly_total:totals.monthly,locale,status:"requested"
    }).select("id,request_code").single();
    if(error||!project) return NextResponse.json({error:"SAVE_FAILED"},{status:503});
    try { await admin.from("project_messages").insert({project_id:project.id,sender_role:"system",sender_email:"no-reply@voidworks.eu",source:"system",body:locale==="nl"?"Projectaanvraag ontvangen.":locale==="de"?"Projektanfrage erhalten.":"Project request received."}); } catch {}

    const addonNames=availableAddons(packageId).filter(item=>selectedAddons.includes(item.id)).map(item=>item.names[locale]);
    if(packageId==="platform") addonNames.unshift(locale==="nl"?"Admin panel (inbegrepen)":locale==="de"?"Admin-Panel (inklusive)":"Admin panel (included)");
    let emailSent=false; let adminEmailSent=false;
    try{
      const mailResult=await sendProjectRequestEmails({id:project.id,request_code:project.request_code,requester_name:requesterName,requester_email:requesterEmail,company_name:companyName,company_description:companyDescription,package_name:pack.names[locale],site_type:siteType,site_requirements:siteRequirements,style_reference:styleReference||null,addon_names:addonNames,one_time_total:totals.once,monthly_total:totals.monthly,locale});
      emailSent=mailResult.clientSent; adminEmailSent=mailResult.adminSent;
    }catch(error){console.error(`[project-request/email] ${error instanceof Error?error.message.slice(0,220):"failed"}`);}
    return NextResponse.json({ok:true,id:project.id,requestCode:project.request_code,emailSent,adminEmailSent,linked:Boolean(userId)},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error(`[project-request] ${error instanceof Error?error.message.slice(0,220):"failed"}`);return NextResponse.json({error:"REQUEST_FAILED"},{status:503});}
}
