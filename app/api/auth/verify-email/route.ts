import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/security/users";
import { hashSecret, safeEqualHex } from "@/lib/security/crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, rejectCrossOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const body = await request.json() as { email?: string; code?: string };
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const code = String(body.code || "").trim();
    const ip = getClientIp(request);
    if (!(await consumeRateLimit(`verify:${ip}:${email}`, 10, 600))) return NextResponse.json({ error:"RATE_LIMIT" }, { status:429 });
    if (!/^\d{6}$/.test(code)) return NextResponse.json({ error:"INVALID_CODE" }, { status:400 });

    const user = await findAuthUserByEmail(email);
    if (!user) return NextResponse.json({ error:"INVALID_CODE" }, { status:400 });
    const admin = createAdminClient();
    const { data: record, error: readError } = await admin.from("email_verification_codes")
      .select("code_hash,expires_at,attempts,consumed_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (readError || !record || record.consumed_at) return NextResponse.json({ error:"INVALID_CODE" }, { status:400 });
    if (new Date(record.expires_at).getTime() <= Date.now()) return NextResponse.json({ error:"CODE_EXPIRED" }, { status:400 });
    if (record.attempts >= 6) return NextResponse.json({ error:"CODE_LOCKED" }, { status:400 });

    const expected = hashSecret(code, "verify-email");
    if (!safeEqualHex(record.code_hash, expected)) {
      await admin.from("email_verification_codes").update({ attempts:record.attempts + 1 }).eq("user_id", user.id).is("consumed_at", null);
      return NextResponse.json({ error:"INVALID_CODE" }, { status:400 });
    }

    // Confirm Supabase Auth first. If this succeeds, session/start can safely heal a profile write.
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: { ...(user.user_metadata || {}), voidworks_verification_required:false },
    });
    if (authError) return NextResponse.json({ error:"VERIFY_FAILED" }, { status:500 });

    const verifiedAt = new Date().toISOString();
    const { error: profileError } = await admin.from("profiles").upsert({
      id:user.id,
      email:user.email || email,
      full_name:user.user_metadata?.full_name || "",
      email_verified_at:verifiedAt,
      updated_at:verifiedAt,
    });
    const { error: consumeError } = await admin.from("email_verification_codes")
      .update({ consumed_at:verifiedAt })
      .eq("user_id", user.id)
      .is("consumed_at", null);
    if (profileError || consumeError) return NextResponse.json({ error:"VERIFY_FAILED" }, { status:500 });

    return NextResponse.json({ ok:true }, { headers:{ "Cache-Control":"no-store" } });
  } catch {
    return NextResponse.json({ error:"VERIFY_FAILED" }, { status:500 });
  }
}
