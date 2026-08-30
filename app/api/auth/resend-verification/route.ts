import { NextResponse } from "next/server";
import { findAuthUserByEmail } from "@/lib/security/users";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, rejectCrossOrigin } from "@/lib/security/request";
import { sendVerificationCode } from "@/lib/email/resend";
import { issueVerificationCode } from "@/lib/security/email-verification";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  try {
    const body = await request.json() as { email?: string; locale?: string };
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const locale = body.locale === "en" || body.locale === "de" ? body.locale : "nl";
    const ip = getClientIp(request);

    if (!(await consumeRateLimit(`resend:${ip}:${email}`, 6, 3600))) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }

    const user = await findAuthUserByEmail(email);
    if (!user) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    if (user.email_confirmed_at && user.user_metadata?.voidworks_verification_required !== true) {
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    const { code } = await issueVerificationCode(user);
    try {
      await sendVerificationCode(email, user.user_metadata?.full_name || "", code, locale);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      console.error(`[auth/resend/email] ${message.slice(0, 300)}`);
      return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(`[auth/resend] ${message.slice(0, 300)}`);
    return NextResponse.json({ error: "RESEND_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
