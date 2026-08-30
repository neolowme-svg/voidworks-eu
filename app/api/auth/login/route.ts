import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, isLikelyBotTrap, rejectCrossOrigin, validFormAge } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";
import { createAppSession } from "@/lib/security/session";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  try {
    const body = await request.json() as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const password = String(body.password || "");
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

    const allowedIp = await consumeRateLimit(`login:ip:${ip}`, 12, 900);
    const allowedEmail = await consumeRateLimit(`login:email:${email}`, 10, 900);
    if (!allowedIp || !allowedEmail) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });

    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      const code = String((error as { code?: string } | null)?.code || "");
      const message = String(error?.message || "").toLowerCase();
      if (code === "email_not_confirmed" || message.includes("not confirmed") || message.includes("not verified")) {
        return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
      }
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    if (!data.user.email_confirmed_at || data.user.user_metadata?.voidworks_verification_required === true) {
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    await createAppSession(data.user.id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "LOGIN_FAILED" }, { status: 500 });
  }
}
