import { NextResponse } from "next/server";
import { findAuthUserByEmail } from "@/lib/security/users";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, rejectCrossOrigin } from "@/lib/security/request";
import { syncProfileBestEffort, verifyUserCode } from "@/lib/security/email-verification";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  try {
    const body = await request.json() as { email?: string; code?: string };
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const code = String(body.code || "").trim();
    const ip = getClientIp(request);

    if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await consumeRateLimit(`verify:${ip}:${email}`, 12, 600))) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }

    const user = await findAuthUserByEmail(email);
    if (!user) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (user.email_confirmed_at && user.user_metadata?.voidworks_verification_required !== true) {
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    const result = await verifyUserCode(user, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === "VERIFY_FAILED" ? 503 : 400, headers: { "Cache-Control": "no-store" } });
    }

    const refreshed = await findAuthUserByEmail(email);
    if (refreshed) await syncProfileBestEffort(refreshed);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(`[auth/verify-email] ${message.slice(0, 300)}`);
    return NextResponse.json({ error: "VERIFY_FAILED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
