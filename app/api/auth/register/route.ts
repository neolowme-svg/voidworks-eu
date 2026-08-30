import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/security/users";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, rejectCrossOrigin } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";
import { sendVerificationCode } from "@/lib/email/resend";
import { issueVerificationCode, syncProfileBestEffort } from "@/lib/security/email-verification";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validPassword = (value: string) => value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value);

function duplicateError(error: unknown) {
  const value = error as { code?: string; message?: string } | null;
  const code = String(value?.code || "").toLowerCase();
  const message = String(value?.message || "").toLowerCase();
  return code.includes("already") || code.includes("exists") || message.includes("already") || message.includes("exists") || message.includes("registered");
}

function safeLog(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "unknown");
  console.error(`[${scope}] ${message.slice(0, 300)}`);
}

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

    if (name.length < 2 || !emailPattern.test(email) || !validPassword(password)) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const turnstile = await verifyTurnstile(String(body.turnstileToken || ""), "register");
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: turnstile.unavailable ? "SECURITY_UNAVAILABLE" : "BOT_CHECK_FAILED" },
        { status: turnstile.unavailable ? 503 : 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!(await consumeRateLimit(`register:ip:${ip}`, 8, 3600)) || !(await consumeRateLimit(`register:email:${email}`, 6, 3600))) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }

    const admin = createAdminClient();
    let user: User | null = null;
    let created = false;

    const createdResult = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: name, voidworks_verification_required: true },
    });

    if (!createdResult.error && createdResult.data.user) {
      user = createdResult.data.user;
      created = true;
    } else if (duplicateError(createdResult.error)) {
      const existing = await findAuthUserByEmail(email);
      if (!existing || existing.email_confirmed_at || existing.user_metadata?.voidworks_verification_required === false) {
        return NextResponse.json({ error: "EMAIL_REGISTERED" }, { status: 409, headers: { "Cache-Control": "no-store" } });
      }

      const recovered = await admin.auth.admin.updateUserById(existing.id, {
        password,
        user_metadata: { ...(existing.user_metadata || {}), full_name: name, voidworks_verification_required: true },
      });
      if (recovered.error || !recovered.data.user) {
        safeLog("auth/register/recover", recovered.error);
        return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
      user = recovered.data.user;
    } else {
      safeLog("auth/register/create", createdResult.error);
      return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    try {
      const { code } = await issueVerificationCode(user);
      await syncProfileBestEffort(user, name);

      let emailSent = true;
      try {
        await sendVerificationCode(email, name, code, locale);
      } catch (error) {
        emailSent = false;
        safeLog("auth/register/email", error);
      }

      return NextResponse.json(
        { ok: true, verificationRequired: true, emailSent },
        { status: created ? 201 : 200, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      safeLog("auth/register/verification", error);
      if (created) await admin.auth.admin.deleteUser(user.id).catch(() => null);
      return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  } catch (error) {
    safeLog("auth/register", error);
    return NextResponse.json({ error: "REGISTER_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
