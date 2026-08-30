import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/security/users";
import { sixDigitCode, hashSecret } from "@/lib/security/crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, isLikelyBotTrap, rejectCrossOrigin, validFormAge } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";
import { sendVerificationCode } from "@/lib/email/resend";
import { VERIFY_CODE_MINUTES } from "@/lib/security/config";

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
    const turnstile = await verifyTurnstile(String(body.turnstileToken || ""), ip);
    if (!turnstile.ok) return NextResponse.json({ error: "BOT_CHECK_FAILED" }, { status: 403 });

    if (!(await consumeRateLimit(`register:ip:${ip}`, 5, 3600)) || !(await consumeRateLimit(`register:email:${email}`, 3, 3600))) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }
    if (name.length < 2 || !emailPattern.test(email) || !validPassword(password)) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const admin = createAdminClient();
    const existingUser = await findAuthUserByEmail(email);
    if (existingUser) {
      const { data: existingProfile, error: existingProfileError } = await admin.from("profiles").select("id").eq("id", existingUser.id).maybeSingle();
      if (existingProfileError) return NextResponse.json({ error:"REGISTER_FAILED" }, { status:500 });
      if (existingProfile) return NextResponse.json({ error:"EMAIL_REGISTERED" }, { status:409 });
      // Orphaned Auth user: the app account was deleted, so remove the stale auth record before re-registration.
      const { error: orphanDeleteError } = await admin.auth.admin.deleteUser(existingUser.id);
      if (orphanDeleteError) return NextResponse.json({ error:"REGISTER_FAILED" }, { status:500 });
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: name, voidworks_verification_required: true },
    });
    if (error || !data.user) {
      if (error?.message.toLowerCase().includes("already")) return NextResponse.json({ error: "EMAIL_REGISTERED" }, { status: 409 });
      return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 400, headers: { "Cache-Control":"no-store" } });
    }

    const code = sixDigitCode();
    const codeHash = hashSecret(code, "verify-email");
    const expiresAt = new Date(Date.now() + VERIFY_CODE_MINUTES * 60 * 1000).toISOString();

    const { error: profileError } = await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: name,
      email_verified_at: null,
      updated_at: new Date().toISOString(),
    });
    const { error: codeError } = await admin.from("email_verification_codes").upsert({
      user_id: data.user.id,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      consumed_at: null,
      last_sent_at: new Date().toISOString(),
    });
    if (profileError || codeError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 500, headers: { "Cache-Control":"no-store" } });
    }

    try {
      await sendVerificationCode(email, name, code, locale);
    } catch {
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 503 });
    }

    return NextResponse.json({ ok: true, verificationRequired: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 500, headers: { "Cache-Control":"no-store" } });
  }
}
