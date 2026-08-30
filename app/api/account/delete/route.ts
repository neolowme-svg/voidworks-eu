import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCsrf } from "@/lib/security/csrf";
import { rejectCrossOrigin } from "@/lib/security/request";
import { revokeCurrentAppSession } from "@/lib/security/session";

export async function DELETE(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  if (!(await requireCsrf(request))) return NextResponse.json({ error: "CSRF" }, { status: 403 });

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });

    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });

    await revokeCurrentAppSession();
    await supabase.auth.signOut({ scope: "local" }).catch(() => null);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}
