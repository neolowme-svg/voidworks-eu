import { NextResponse } from "next/server";
import { getAuthorizedAdmin } from "@/lib/security/admin-api";
import { requireCsrf } from "@/lib/security/csrf";
import { rejectCrossOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  if (!(await requireCsrf(request))) return NextResponse.json({ error:"CSRF" }, { status:403 });
  if (!(await getAuthorizedAdmin())) return NextResponse.json({ error:"FORBIDDEN" }, { status:403 });

  const token = process.env.GITHUB_BACKUP_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || "neolowme-svg/voidworks-eu";
  if (!token || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) return NextResponse.json({ error:"BACKUP_NOT_CONFIGURED" }, { status:503 });

  const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/database-backup.yml/dispatches`, {
    method:"POST",
    headers:{ Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28", "Content-Type":"application/json" },
    body:JSON.stringify({ ref:"main" }), cache:"no-store",
  });
  if (!response.ok) return NextResponse.json({ error:"BACKUP_START_FAILED" }, { status:502 });
  return NextResponse.json({ ok:true }, { status:202 });
}
