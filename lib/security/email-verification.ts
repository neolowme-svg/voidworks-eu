import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashSecret, safeEqualHex, sixDigitCode } from "@/lib/security/crypto";
import { VERIFY_CODE_MINUTES } from "@/lib/security/config";

type VerificationState = {
  codeHash: string;
  expiresAt: string;
  attempts: number;
};

export function readVerificationState(user: User): VerificationState | null {
  const raw = user.app_metadata?.voidworks_verification;
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const codeHash = typeof value.codeHash === "string" ? value.codeHash : "";
  const expiresAt = typeof value.expiresAt === "string" ? value.expiresAt : "";
  const attempts = typeof value.attempts === "number" && Number.isFinite(value.attempts) ? value.attempts : 0;
  if (!/^[a-f0-9]{64}$/i.test(codeHash) || Number.isNaN(Date.parse(expiresAt))) return null;
  return { codeHash, expiresAt, attempts };
}

export async function issueVerificationCode(user: User) {
  const code = sixDigitCode();
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + VERIFY_CODE_MINUTES * 60 * 1000).toISOString();
  const appMetadata = {
    ...(user.app_metadata || {}),
    voidworks_verification: {
      codeHash: hashSecret(code, "verify-email"),
      expiresAt,
      attempts: 0,
    },
  };
  const { error } = await admin.auth.admin.updateUserById(user.id, { app_metadata: appMetadata });
  if (error) throw new Error("Verification state could not be saved");
  return { code, expiresAt };
}

export async function verifyUserCode(user: User, code: string) {
  const state = readVerificationState(user);
  if (!state) return { ok: false as const, error: "INVALID_CODE" as const };
  if (new Date(state.expiresAt).getTime() <= Date.now()) return { ok: false as const, error: "CODE_EXPIRED" as const };
  if (state.attempts >= 6) return { ok: false as const, error: "CODE_LOCKED" as const };

  const expected = hashSecret(code, "verify-email");
  const admin = createAdminClient();
  if (!safeEqualHex(state.codeHash, expected)) {
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
    // The auth flow must not fail just because optional app tables are unavailable.
  }
}
