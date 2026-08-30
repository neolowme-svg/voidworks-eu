type TurnstileResult = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export type TurnstileVerification = {
  ok: boolean;
  configured: boolean;
  unavailable: boolean;
};

const CONFIG_ERRORS = new Set([
  "missing-input-secret",
  "invalid-input-secret",
  "internal-error",
]);

export async function verifyTurnstile(token: string | null | undefined): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  // If bot protection is intentionally not configured, don't brick authentication.
  if (!secret || !siteKey) return { ok: true, configured: false, unavailable: false };
  if (!token || token.length > 2048) return { ok: false, configured: true, unavailable: false };

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return { ok: false, configured: true, unavailable: true };

    const result = (await response.json()) as TurnstileResult;
    if (result.success !== true) {
      const errors = result["error-codes"] ?? [];
      const unavailable = errors.some((code) => CONFIG_ERRORS.has(code));
      return { ok: false, configured: true, unavailable };
    }

    const hostname = (result.hostname || "").toLowerCase();
    if (
      process.env.NODE_ENV === "production" &&
      hostname &&
      hostname !== "voidworks.eu" &&
      hostname !== "www.voidworks.eu"
    ) {
      return { ok: false, configured: true, unavailable: false };
    }

    return { ok: true, configured: true, unavailable: false };
  } catch {
    return { ok: false, configured: true, unavailable: true };
  }
}
