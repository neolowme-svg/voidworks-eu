import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BACKUP_BUCKET } from "@/lib/security/config";
import { getAuthorizedAdmin, safeBackupName } from "@/lib/security/admin-api";
import { requireCsrf } from "@/lib/security/csrf";
import { rejectCrossOrigin } from "@/lib/security/request";

export async function DELETE(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  if (!(await requireCsrf(request))) return NextResponse.json({ error:"CSRF" }, { status:403 });
  if (!(await getAuthorizedAdmin())) return NextResponse.json({ error:"FORBIDDEN" }, { status:403 });
  const body = await request.json().catch(() => ({})) as { name?:string };
  const name = String(body.name || "");
  if (!safeBackupName(name)) return NextResponse.json({ error:"INVALID_FILE" }, { status:400 });
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BACKUP_BUCKET).remove([name]);
  if (error) return NextResponse.json({ error:"DELETE_FAILED" }, { status:500 });
  return NextResponse.json({ ok:true });
}
