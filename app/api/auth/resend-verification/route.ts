import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/security/users";
import { sixDigitCode, hashSecret } from "@/lib/security/crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, rejectCrossOrigin } from "@/lib/security/request";
import { sendVerificationCode } from "@/lib/email/resend";
import { VERIFY_CODE_MINUTES } from "@/lib/security/config";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const body = await request.json() as { email?: string; locale?: string };
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const locale = body.locale === "en" || body.locale === "de" ? body.locale : "nl";
    const ip = getClientIp(request);
    if (!(await consumeRateLimit(`resend:${ip}:${email}`, 3, 3600))) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    const user = await findAuthUserByEmail(email);
    if (!user) return NextResponse.json({ ok: true });
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("full_name,email_verified_at").eq("id", user.id).maybeSingle();
    if (profile?.email_verified_at) return NextResponse.json({ ok: true });

    const code = sixDigitCode();
    const { error: codeError } = await admin.from("email_verification_codes").upsert({
      user_id: user.id,
      code_hash: hashSecret(code, "verify-email"),
      expires_at: new Date(Date.now() + VERIFY_CODE_MINUTES * 60 * 1000).toISOString(),
      attempts: 0,
      consumed_at: null,
      last_sent_at: new Date().toISOString(),
    });
    if (codeError) return NextResponse.json({ error:"RESEND_FAILED" }, { status:500 });
    try { await sendVerificationCode(email, profile?.full_name || user.user_metadata?.full_name || "", code, locale); } catch { return NextResponse.json({ error:"EMAIL_SEND_FAILED" }, { status:503 }); }
    return NextResponse.json({ ok:true }, { headers:{ "Cache-Control":"no-store" } });
  } catch {
    return NextResponse.json({ error: "RESEND_FAILED" }, { status: 500 });
  }
}
