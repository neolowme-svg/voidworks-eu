import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BACKUP_BUCKET } from "@/lib/security/config";
import { getAuthorizedAdmin, safeBackupName } from "@/lib/security/admin-api";

export async function GET(request: Request) {
  if (!(await getAuthorizedAdmin())) return NextResponse.json({ error:"FORBIDDEN" }, { status:403 });
  const name = new URL(request.url).searchParams.get("name") || "";
  if (!safeBackupName(name)) return NextResponse.json({ error:"INVALID_FILE" }, { status:400 });
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BACKUP_BUCKET).createSignedUrl(name, 60, { download:name });
  if (error || !data?.signedUrl) return NextResponse.json({ error:"DOWNLOAD_FAILED" }, { status:404 });
  return NextResponse.redirect(data.signedUrl, { status:302 });
}
