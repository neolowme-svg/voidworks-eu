import { NextResponse } from "next/server";
import { hashSecret } from "@/lib/security/crypto";

const PRODUCTION_HOSTS = new Set(["voidworks.eu", "www.voidworks.eu"]);

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

export function getHashedClientIp(request: Request) {
  return hashSecret(getClientIp(request), "ip");
}

function allowedHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (PRODUCTION_HOSTS.has(host)) return true;
  if (process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1")) return true;
  return false;
}

export function sameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return true;

  try {
    const sourceUrl = new URL(source);
    const targetUrl = new URL(request.url);

    // Direct same-origin requests always pass.
    if (sourceUrl.protocol === targetUrl.protocol && sourceUrl.host === targetUrl.host) return true;

    // Vercel can internally rewrite the request URL while the browser Origin remains
    // the public custom domain. Accept only our explicit production hostnames.
    return sourceUrl.protocol === "https:" && allowedHost(sourceUrl.hostname);
  } catch {
    return false;
  }
}

export function rejectCrossOrigin(request: Request) {
  if (sameOrigin(request)) return null;
  return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
}

export function isLikelyBotTrap(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validFormAge(startedAt: unknown) {
  const timestamp = Number(startedAt);
  if (!Number.isFinite(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age >= 0 && age <= 2 * 60 * 60 * 1000;
}
