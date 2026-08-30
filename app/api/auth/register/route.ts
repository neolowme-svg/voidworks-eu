import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/security/users";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, isLikelyBotTrap, rejectCrossOrigin, validFormAge } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";
import { sendVerificationCode } from "@/lib/email/resend";
import { issueVerificationCode, syncProfileBestEffort } from "@/lib/security/email-verification";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validPassword = (value: string) => value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value);

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  try {
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name || "").trim().slice(0, 80);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const password = String(body.password || "");
    const locale = body.locale === "en" || body.locale === "de" ? body.locale : "nl";
    const ip = getClientIp(request);

    if (isLikelyBotTrap(body.companyWebsite) || !validFormAge(body.startedAt)) {
      return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
    }

    const turnstile = await verifyTurnstile(String(body.turnstileToken || ""));
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: turnstile.unavailable ? "SECURITY_UNAVAILABLE" : "BOT_CHECK_FAILED" },
        { status: turnstile.unavailable ? 503 : 403 },
      );
    }

    if (!(await consumeRateLimit(`register:ip:${ip}`, 7, 3600)) || !(await consumeRateLimit(`register:email:${email}`, 5, 3600))) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    if (name.length < 2 || !emailPattern.test(email) || !validPassword(password)) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const admin = createAdminClient();
    const existingUser = await findAuthUserByEmail(email);
    if (existingUser) {
      if (existingUser.email_confirmed_at || existingUser.user_metadata?.voidworks_verification_required === false) {
        return NextResponse.json({ error: "EMAIL_REGISTERED" }, { status: 409 });
      }

      // Recover an earlier unfinished registration instead of creating a duplicate account.
      // The new form password becomes the password for that unfinished account.
      const { data: recoveredData, error: recoveryError } = await admin.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: { ...(existingUser.user_metadata || {}), full_name: name, voidworks_verification_required: true },
      });
      if (recoveryError || !recoveredData.user) return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 500 });
      const { code } = await issueVerificationCode(recoveredData.user);
      let emailSent = true;
      try {
        await sendVerificationCode(email, name, code, locale);
      } catch {
        emailSent = false;
      }
      return NextResponse.json({ ok: true, verificationRequired: true, emailSent, recovered: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: name, voidworks_verification_required: true },
    });

    if (error || !data.user) {
      if (error?.message.toLowerCase().includes("already")) {
        return NextResponse.json({ error: "EMAIL_REGISTERED" }, { status: 409 });
      }
      return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const { code } = await issueVerificationCode(data.user);
    await syncProfileBestEffort(data.user, name);

    let emailSent = true;
    try {
      await sendVerificationCode(email, name, code, locale);
    } catch {
      emailSent = false;
    }

    return NextResponse.json({ ok: true, verificationRequired: true, emailSent }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
