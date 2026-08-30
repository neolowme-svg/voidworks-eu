import { createAdminClient } from "@/lib/supabase/admin";
import { hashSecret } from "@/lib/security/crypto";

type Entry = { count: number; resetAt: number };
const fallback = new Map<string, Entry>();

function consumeMemory(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const current = fallback.get(key);
  if (!current || current.resetAt <= now) {
    fallback.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  current.count += 1;
  fallback.set(key, current);
  return current.count <= limit;
}

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const keyHash = hashSecret(key, "rate-limit");

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (!error && typeof data === "boolean") return data;
  } catch {
    // Fall back to an in-process limiter instead of breaking login/register when
    // the optional database limiter migration has not been applied yet.
  }

  return consumeMemory(keyHash, limit, windowSeconds);
}
