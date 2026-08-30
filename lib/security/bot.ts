type TurnstileResult = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile(token: string | null | undefined, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!secret || !siteKey) return { ok: true, configured: false };
  if (!token || token.length > 2048) return { ok: false, configured: true };

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip && ip !== "unknown") form.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false, configured: true };
    const result = await response.json() as TurnstileResult;
    if (result.success !== true) return { ok: false, configured: true };

    // When Cloudflare supplies a hostname, make sure a production token belongs to Voidworks.
    const hostname = (result.hostname || "").toLowerCase();
    if (process.env.NODE_ENV === "production" && hostname && hostname !== "voidworks.eu" && hostname !== "www.voidworks.eu") {
      return { ok: false, configured: true };
    }
    return { ok: true, configured: true };
  } catch {
    return { ok: false, configured: true };
  }
}
