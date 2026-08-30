import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

export async function requireCsrf(request: Request) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("vw_csrf")?.value || "";
  const headerValue = request.headers.get("x-voidworks-csrf") || "";
  if (!cookieValue || !headerValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(headerValue);
  return a.length === b.length && timingSafeEqual(a, b);
}
