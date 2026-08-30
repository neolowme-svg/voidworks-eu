import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashSecret, safeEqualHex, sixDigitCode } from "@/lib/security/crypto";
import { VERIFY_CODE_MINUTES } from "@/lib/security/config";

type VerificationState = {
  codeHash: string;
  expiresAt: string;
  attempts: number;
};

function stateFromMetadata(user: User): VerificationState | null {
  const raw = user.app_metadata?.voidworks_verification;
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const codeHash = typeof value.codeHash === "string" ? value.codeHash : "";
  const expiresAt = typeof value.expiresAt === "string" ? value.expiresAt : "";
  const attempts = typeof value.attempts === "number" && Number.isFinite(value.attempts) ? value.attempts : 0;
  if (!/^[a-f0-9]{64}$/i.test(codeHash) || Number.isNaN(Date.parse(expiresAt))) return null;
  return { codeHash, expiresAt, attempts };
}

async function saveCodeInDatabase(userId: string, codeHash: string, expiresAt: string) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("email_verification_codes").upsert({
      user_id: userId,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      consumed_at: null,
      last_sent_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    return !error;
  } catch {
    return false;
  }
}

async function saveCodeInMetadata(user: User, codeHash: string, expiresAt: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(user.app_metadata || {}),
      voidworks_verification: { codeHash, expiresAt, attempts: 0 },
    },
  });
  return !error;
}

export async function issueVerificationCode(user: User) {
  const code = sixDigitCode();
  const codeHash = hashSecret(code, "verify-email");
  const expiresAt = new Date(Date.now() + VERIFY_CODE_MINUTES * 60 * 1000).toISOString();

  // Prefer the dedicated private table. Fall back to app_metadata so an auth
  // migration problem cannot make registration unusable.
  const stored = await saveCodeInDatabase(user.id, codeHash, expiresAt) || await saveCodeInMetadata(user, codeHash, expiresAt);
  if (!stored) throw new Error("Verification state could not be saved");
  return { code, expiresAt };
}

async function verifyFromDatabase(user: User, expectedHash: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_verification_codes")
      .select("code_hash,expires_at,attempts,consumed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return null;
    if (!data || data.consumed_at) return { ok: false as const, error: "INVALID_CODE" as const };
    if (new Date(String(data.expires_at)).getTime() <= Date.now()) return { ok: false as const, error: "CODE_EXPIRED" as const };
    if (Number(data.attempts || 0) >= 6) return { ok: false as const, error: "CODE_LOCKED" as const };

    if (!safeEqualHex(String(data.code_hash || ""), expectedHash)) {
      await admin.from("email_verification_codes").update({ attempts: Number(data.attempts || 0) + 1 }).eq("user_id", user.id);
      return { ok: false as const, error: "INVALID_CODE" as const };
    }

    const nextAppMetadata = { ...(user.app_metadata || {}) } as Record<string, unknown>;
    delete nextAppMetadata.voidworks_verification;
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: { ...(user.user_metadata || {}), voidworks_verification_required: false },
      app_metadata: nextAppMetadata,
    });
    if (authError) return { ok: false as const, error: "VERIFY_FAILED" as const };

    await admin.from("email_verification_codes").update({ consumed_at: new Date().toISOString() }).eq("user_id", user.id);
    return { ok: true as const };
  } catch {
    return null;
  }
}

async function verifyFromMetadata(user: User, expectedHash: string) {
  const state = stateFromMetadata(user);
  if (!state) return { ok: false as const, error: "INVALID_CODE" as const };
  if (new Date(state.expiresAt).getTime() <= Date.now()) return { ok: false as const, error: "CODE_EXPIRED" as const };
  if (state.attempts >= 6) return { ok: false as const, error: "CODE_LOCKED" as const };

  const admin = createAdminClient();
  if (!safeEqualHex(state.codeHash, expectedHash)) {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata || {}),
        voidworks_verification: { ...state, attempts: state.attempts + 1 },
      },
    });
    return { ok: false as const, error: "INVALID_CODE" as const };
  }

  const nextAppMetadata = { ...(user.app_metadata || {}) } as Record<string, unknown>;
  delete nextAppMetadata.voidworks_verification;
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
    user_metadata: { ...(user.user_metadata || {}), voidworks_verification_required: false },
    app_metadata: nextAppMetadata,
  });
  if (error) return { ok: false as const, error: "VERIFY_FAILED" as const };
  return { ok: true as const };
}

export async function verifyUserCode(user: User, code: string) {
  const expectedHash = hashSecret(code, "verify-email");
  const databaseResult = await verifyFromDatabase(user, expectedHash);
  if (databaseResult) return databaseResult;
  return verifyFromMetadata(user, expectedHash);
}

export async function syncProfileBestEffort(user: User, fullName?: string) {
  try {
    const admin = createAdminClient();
    await admin.from("profiles").upsert({
      id: user.id,
      email: user.email || null,
      full_name: fullName ?? user.user_metadata?.full_name ?? "",
      email_verified_at: user.email_confirmed_at || null,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Optional app data must never break authentication.
  }
}
