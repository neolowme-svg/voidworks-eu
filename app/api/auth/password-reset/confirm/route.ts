import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashSecret } from "@/lib/security/crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, rejectCrossOrigin } from "@/lib/security/request";

const validPassword = (value: string) => value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value);

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const body = await request.json() as { token?: string; password?: string };
    const token = String(body.token || "");
    const password = String(body.password || "");
    const ip = getClientIp(request);
    if (!(await consumeRateLimit(`reset-confirm:${ip}`, 8, 900))) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    if (token.length < 30 || !validPassword(password)) return NextResponse.json({ error: "INVALID_RESET" }, { status: 400 });

    const admin = createAdminClient();
    const { data: userId, error } = await admin.rpc("consume_password_reset_token", { p_token_hash: hashSecret(token, "password-reset") });
    if (error || !userId) return NextResponse.json({ error: "INVALID_RESET" }, { status: 400 });
    const { error: passwordError } = await admin.auth.admin.updateUserById(String(userId), { password });
    if (passwordError) return NextResponse.json({ error: "RESET_FAILED" }, { status: 500 });
    await admin.from("app_sessions").update({ revoked_at: new Date().toISOString() }).eq("user_id", String(userId)).is("revoked_at", null);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "RESET_FAILED" }, { status: 500 });
  }
}
