import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

function secret() {
  const value = process.env.APP_SECURITY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!value) throw new Error("APP_SECURITY_SECRET ontbreekt.");
  return value;
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sixDigitCode() {
  return String(randomInt(100000, 1000000));
}

export function hashSecret(value: string, context: string) {
  return createHmac("sha256", secret()).update(`${context}:${value}`).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  try {
    const aa = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    return aa.length === bb.length && timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}
