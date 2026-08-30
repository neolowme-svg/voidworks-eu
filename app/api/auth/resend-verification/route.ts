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

    if (!(await consumeRateLimit(`resend:${ip}:${email}`, 5, 3600))) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    const user = await findAuthUserByEmail(email);
    if (!user || user.email_confirmed_at) return NextResponse.json({ ok: true });

    const { code } = await issueVerificationCode(user);
    try {
      await sendVerificationCode(email, user.user_metadata?.full_name || "", code, locale);
    } catch {
      return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 503 });
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "RESEND_FAILED" }, { status: 500 });
  }
}
