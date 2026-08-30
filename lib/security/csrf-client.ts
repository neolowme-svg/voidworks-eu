let cachedToken = "";

export async function getCsrfToken() {
  if (cachedToken) return cachedToken;
  const response = await fetch("/api/security/csrf", { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error("Security token unavailable");
  const data = await response.json() as { token?: string };
  if (!data.token) throw new Error("Security token unavailable");
  cachedToken = data.token;
  return cachedToken;
}
