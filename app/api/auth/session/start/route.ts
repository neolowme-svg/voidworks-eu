import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    if (!user.email_confirmed_at || user.user_metadata?.voidworks_verification_required === true) {
      return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    await createAppSession(user.id);
    return NextResponse.json({ ok: true, isAdmin: isAdminEmail(user.email) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "SESSION_FAILED" }, { status: 500 });
  }
}
