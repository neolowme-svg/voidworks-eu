import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { APP_SESSION_DAYS } from "@/lib/security/config";

const COOKIE = "vw_session";

function appSecret() {
  const value = process.env.APP_SECURITY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!value) throw new Error("APP_SECURITY_SECRET missing");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", appSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  try {
    const aa = Buffer.from(a);
    const bb = Buffer.from(b);
    return aa.length === bb.length && timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

export async function createAppSession(userId: string) {
  const expires = Math.floor(Date.now() / 1000) + APP_SESSION_DAYS * 24 * 60 * 60;
  const nonce = randomBytes(18).toString("base64url");
  const payload = `${userId}.${expires}.${nonce}`;
  const value = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: APP_SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function validateAppSession(userId: string) {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 4) return false;
  const [storedUserId, expiresRaw, nonce, signature] = parts;
  const expires = Number(expiresRaw);
  if (storedUserId !== userId || !Number.isFinite(expires) || expires <= Math.floor(Date.now() / 1000) || !nonce || !signature) return false;
  const payload = `${storedUserId}.${expiresRaw}.${nonce}`;
  return safeEqual(signature, sign(payload));
}

export async function revokeCurrentAppSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
