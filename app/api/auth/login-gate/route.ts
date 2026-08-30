import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, isLikelyBotTrap, rejectCrossOrigin, validFormAge } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";

// Kept for backwards compatibility with older clients. v11 uses /api/auth/login.
export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const ip = getClientIp(request);
    if (isLikelyBotTrap(body.companyWebsite) || !validFormAge(body.startedAt)) return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
    const turnstile = await verifyTurnstile(String(body.turnstileToken || ""));
    if (!turnstile.ok) return NextResponse.json({ error: turnstile.unavailable ? "SECURITY_UNAVAILABLE" : "BOT_CHECK_FAILED" }, { status: turnstile.unavailable ? 503 : 403 });
    const allowedIp = await consumeRateLimit(`login:ip:${ip}`, 12, 900);
    const allowedEmail = await consumeRateLimit(`login:email:${email}`, 10, 900);
    if (!allowedIp || !allowedEmail) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "LOGIN_GATE_FAILED" }, { status: 500 });
  }
}
