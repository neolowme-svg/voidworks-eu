import { NextResponse } from "next/server";
import { hashSecret } from "@/lib/security/crypto";

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function getHashedClientIp(request: Request) {
  return hashSecret(getClientIp(request), "ip");
}

export function sameOrigin(request: Request) {
  const target = new URL(request.url);
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return true;
  try {
    const url = new URL(source);
    return url.host === target.host && url.protocol === target.protocol;
  } catch {
    return false;
  }
}

export function rejectCrossOrigin(request: Request) {
  if (sameOrigin(request)) return null;
  return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
}

export function isLikelyBotTrap(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

// Only reject stale/invalid forms. Fast human submissions are allowed because Turnstile
// and the honeypot already cover automated submissions without false-positive timing checks.
export function validFormAge(startedAt: unknown) {
  const timestamp = Number(startedAt);
  if (!Number.isFinite(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age >= 0 && age <= 2 * 60 * 60 * 1000;
}
