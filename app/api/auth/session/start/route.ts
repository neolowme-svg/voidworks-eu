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
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });

    const admin = createAdminClient();
    let { data: profile } = await admin.from("profiles").select("id,email_verified_at").eq("id", user.id).maybeSingle();
    if (!profile) {
      const needsVerification = user.user_metadata?.voidworks_verification_required === true;
      const { data } = await admin.from("profiles").upsert({
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || "",
        email_verified_at: needsVerification ? null : (user.email_confirmed_at || new Date().toISOString()),
        updated_at: new Date().toISOString(),
      }).select("id,email_verified_at").single();
      profile = data;
    }
    if (profile && !profile.email_verified_at && user.email_confirmed_at && user.user_metadata?.voidworks_verification_required !== true) {
      const verifiedAt = user.email_confirmed_at;
      await admin.from("profiles").update({ email_verified_at: verifiedAt, updated_at: new Date().toISOString() }).eq("id", user.id);
      profile = { ...profile, email_verified_at: verifiedAt };
    }
    if (!profile?.email_verified_at) return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });

    await createAppSession(user.id);
    return NextResponse.json({ ok: true, isAdmin: isAdminEmail(user.email) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "SESSION_FAILED" }, { status: 500 });
  }
}
