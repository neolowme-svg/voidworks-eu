import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/security/users";
import { randomToken, hashSecret } from "@/lib/security/crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, rejectCrossOrigin } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";
import { sendPasswordReset } from "@/lib/email/resend";
import { RESET_TOKEN_MINUTES } from "@/lib/security/config";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  try {
    const body = await request.json() as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const locale = body.locale === "en" || body.locale === "de" ? body.locale : "nl";
    const ip = getClientIp(request);

    // Keep reset responses non-enumerating.
    if (!emailPattern.test(email)) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

    const turnstile = await verifyTurnstile(String(body.turnstileToken || ""), "password_reset");
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: turnstile.unavailable ? "SECURITY_UNAVAILABLE" : "BOT_CHECK_FAILED" },
        { status: turnstile.unavailable ? 503 : 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!(await consumeRateLimit(`reset-request:${ip}:${email}`, 5, 3600))) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }

    const user = await findAuthUserByEmail(email);
    if (!user) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

    const admin = createAdminClient();
    const raw = randomToken(32);
    const tokenHash = hashSecret(raw, "password-reset");

    await admin.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("user_id", user.id).is("used_at", null);
    const { error } = await admin.from("password_reset_tokens").insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000).toISOString(),
    });
    if (error) return NextResponse.json({ error: "RESET_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });

    const resetUrl = `${new URL(request.url).origin}/reset-password#token=${encodeURIComponent(raw)}`;
    try {
      await sendPasswordReset(email, resetUrl, locale);
    } catch {
      return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(`[auth/password-reset/request] ${message.slice(0, 300)}`);
    return NextResponse.json({ error: "RESET_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
