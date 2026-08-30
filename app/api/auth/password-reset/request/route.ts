import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/security/users";
import { randomToken, hashSecret } from "@/lib/security/crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, isLikelyBotTrap, rejectCrossOrigin, validFormAge } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";
import { sendPasswordReset } from "@/lib/email/resend";
import { RESET_TOKEN_MINUTES } from "@/lib/security/config";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const locale = body.locale === "en" || body.locale === "de" ? body.locale : "nl";
    const ip = getClientIp(request);
    if (isLikelyBotTrap(body.companyWebsite) || !validFormAge(body.startedAt)) return NextResponse.json({ ok: true });
    const turnstile = await verifyTurnstile(String(body.turnstileToken || ""));
    if (!turnstile.ok) return NextResponse.json({ error: turnstile.unavailable ? "SECURITY_UNAVAILABLE" : "BOT_CHECK_FAILED" }, { status: turnstile.unavailable ? 503 : 403 });
    if (!(await consumeRateLimit(`reset-request:${ip}:${email}`, 5, 3600))) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });

    const user = await findAuthUserByEmail(email);
    if (!user) return NextResponse.json({ ok: true });
    const admin = createAdminClient();
    const raw = randomToken(32);
    const tokenHash = hashSecret(raw, "password-reset");
    await admin.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("user_id", user.id).is("used_at", null);
    const { error } = await admin.from("password_reset_tokens").insert({ user_id: user.id, token_hash: tokenHash, expires_at: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000).toISOString() });
    if (error) return NextResponse.json({ error: "RESET_FAILED" }, { status: 500 });
    const resetUrl = `${new URL(request.url).origin}/reset-password#token=${encodeURIComponent(raw)}`;
    try { await sendPasswordReset(email, resetUrl, locale); } catch { return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 503 }); }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "RESET_FAILED" }, { status: 500 });
  }
}
