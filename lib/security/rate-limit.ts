import { createAdminClient } from "@/lib/supabase/admin";
import { hashSecret } from "@/lib/security/crypto";

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const admin = createAdminClient();
  const keyHash = hashSecret(key, "rate-limit");
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Fail closed for auth-sensitive endpoints if the database limiter is unavailable.
    throw new Error("Rate limiter unavailable");
  }
  return data === true;
}
