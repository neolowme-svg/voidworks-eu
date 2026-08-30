import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, isLikelyBotTrap, rejectCrossOrigin, validFormAge } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/bot";

function clean(value: FormDataEntryValue | null, max: number) { return String(value ?? "").trim().slice(0, max); }

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const data = await request.formData();
    const ip = getClientIp(request);
    if (isLikelyBotTrap(data.get("companyWebsite")) || !validFormAge(data.get("startedAt"))) return NextResponse.json({ ok:true }, { status:201 });
    const turnstile = await verifyTurnstile(clean(data.get("turnstileToken"), 2048), "contact");
    if (!turnstile.ok) return NextResponse.json({ error: turnstile.unavailable ? "SECURITY_UNAVAILABLE" : "BOT_CHECK_FAILED" }, { status: turnstile.unavailable ? 503 : 403 });
    if (!(await consumeRateLimit(`contact:${ip}`, 5, 600))) return NextResponse.json({ error:"RATE_LIMIT" }, { status:429 });

    const name = clean(data.get("name"), 80);
    const email = clean(data.get("email"), 160).toLowerCase();
    const type = clean(data.get("type"), 80);
    const message = clean(data.get("message"), 3000);
    if (name.length < 2 || message.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error:"INVALID_INPUT" }, { status:400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from("contact_requests").insert({ name, email, request_type:type, message, status:"new" });
    if (error) return NextResponse.json({ error:"CONTACT_FAILED" }, { status:500 });
    return NextResponse.json({ ok:true }, { status:201, headers:{"Cache-Control":"no-store"} });
  } catch {
    return NextResponse.json({ error:"CONTACT_FAILED" }, { status:500 });
  }
}
