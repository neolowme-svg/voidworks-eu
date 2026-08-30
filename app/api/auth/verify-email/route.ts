import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/security/users";
import { hashSecret } from "@/lib/security/crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, rejectCrossOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const body = await request.json() as { email?: string; code?: string };
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const code = String(body.code || "").trim();
    const ip = getClientIp(request);
    if (!(await consumeRateLimit(`verify:${ip}:${email}`, 10, 600))) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });

    const user = await findAuthUserByEmail(email);
    if (!user) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("verify_email_code", { p_user_id: user.id, p_code_hash: hashSecret(code, "verify-email") });
    if (error || data !== "ok") return NextResponse.json({ error: data === "expired" ? "CODE_EXPIRED" : data === "locked" ? "CODE_LOCKED" : "INVALID_CODE" }, { status: 400 });

    await admin.auth.admin.updateUserById(user.id, { email_confirm: true, user_metadata: { ...(user.user_metadata || {}), voidworks_verification_required: false } });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "VERIFY_FAILED" }, { status: 500 });
  }
}
