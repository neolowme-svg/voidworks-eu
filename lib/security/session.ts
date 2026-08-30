import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashSecret, randomToken } from "@/lib/security/crypto";
import { APP_SESSION_DAYS } from "@/lib/security/config";

const COOKIE = "vw_session";

export async function createAppSession(userId: string) {
  const raw = randomToken(32);
  const tokenHash = hashSecret(raw, "app-session");
  const expiresAt = new Date(Date.now() + APP_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from("app_sessions").insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });
  if (error) throw new Error("Session could not be created");
  const store = await cookies();
  store.set(COOKIE, raw, {
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
  const tokenHash = hashSecret(raw, "app-session");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("app_sessions")
    .select("id,expires_at,revoked_at")
    .eq("user_id", userId)
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) {
    return false;
  }
  await admin.from("app_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  return true;
}

export async function revokeCurrentAppSession(userId?: string) {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw && userId) {
    const admin = createAdminClient();
    await admin.from("app_sessions").update({ revoked_at: new Date().toISOString() }).eq("user_id", userId).eq("token_hash", hashSecret(raw, "app-session"));
  }
  store.delete(COOKIE);
}
