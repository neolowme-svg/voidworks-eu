import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAppSession } from "@/lib/security/session";
import { isAdminEmail } from "@/lib/security/admin";
import { rejectCrossOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const supabase = await createClient();
    const { data:{ user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error:"NOT_AUTHENTICATED" }, { status:401 });

    const admin = createAdminClient();
    const { data:profile, error:profileError } = await admin.from("profiles").select("id,email_verified_at").eq("id",user.id).maybeSingle();
    if (profileError) return NextResponse.json({ error:"SESSION_FAILED" }, { status:500 });
    // A missing profile means the Voidworks account was deleted/orphaned. Never silently recreate it.
    if (!profile) return NextResponse.json({ error:"ACCOUNT_NOT_FOUND" }, { status:403 });

    let verifiedAt = profile.email_verified_at;
    if (!verifiedAt && user.email_confirmed_at && user.user_metadata?.voidworks_verification_required !== true) {
      verifiedAt = user.email_confirmed_at;
      await admin.from("profiles").update({ email_verified_at:verifiedAt, updated_at:new Date().toISOString() }).eq("id",user.id);
    }
    if (!verifiedAt) return NextResponse.json({ error:"EMAIL_NOT_VERIFIED" }, { status:403 });

    await createAppSession(user.id);
    return NextResponse.json({ ok:true, isAdmin:isAdminEmail(user.email) }, { headers:{ "Cache-Control":"no-store" } });
  } catch {
    return NextResponse.json({ error:"SESSION_FAILED" }, { status:500 });
  }
}
