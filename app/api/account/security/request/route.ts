import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { issueAccountActionCode, type AccountAction } from "@/lib/security/account-actions";
type UserAccountAction = Exclude<AccountAction, "password_reset">;
import { sendAccountSecurityCode } from "@/lib/email/resend";
import { requireCsrf } from "@/lib/security/csrf";
import { rejectCrossOrigin } from "@/lib/security/request";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { validateAppSession } from "@/lib/security/session";

const allowed=new Set<UserAccountAction>(["delete_account","change_password","change_profile"]);
function actionLabel(action:UserAccountAction,locale:"nl"|"en"|"de"){
  const labels={nl:{delete_account:"Bevestig dat je je Voidworks-account wilt verwijderen.",change_password:"Bevestig dat je je Voidworks-wachtwoord wilt wijzigen.",change_profile:"Bevestig dat je je Voidworks-profiel wilt wijzigen."},en:{delete_account:"Confirm that you want to delete your Voidworks account.",change_password:"Confirm that you want to change your Voidworks password.",change_profile:"Confirm that you want to change your Voidworks profile."},de:{delete_account:"Bestätige, dass du dein Voidworks-Konto löschen möchtest.",change_password:"Bestätige, dass du dein Voidworks-Passwort ändern möchtest.",change_profile:"Bestätige, dass du dein Voidworks-Profil ändern möchtest."}} as const;return labels[locale][action];
}
export async function POST(request:Request){
  const cross=rejectCrossOrigin(request);if(cross)return cross;if(!(await requireCsrf(request)))return NextResponse.json({error:"CSRF"},{status:403});
  try{const body=await request.json() as Record<string,unknown>;const action=String(body.action||"") as UserAccountAction;const locale=body.locale==="de"||body.locale==="nl"?body.locale:"en";if(!allowed.has(action))return NextResponse.json({error:"INVALID_ACTION"},{status:400});const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user||!user.email||!(await validateAppSession(user.id)))return NextResponse.json({error:"NOT_AUTHENTICATED"},{status:401});if(!(await consumeRateLimit(`account-code:${user.id}:${action}`,5,3600)))return NextResponse.json({error:"RATE_LIMIT"},{status:429});const code=await issueAccountActionCode(user,action);await sendAccountSecurityCode(user.email,code,locale,actionLabel(action,locale));return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});}catch(error){console.error(`[account/security/request] ${error instanceof Error?error.message.slice(0,200):"failed"}`);return NextResponse.json({error:"CODE_FAILED"},{status:503});}
}
