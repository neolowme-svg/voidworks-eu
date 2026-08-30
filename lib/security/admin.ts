import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/security/config";
import { validateAppSession } from "@/lib/security/session";

export function isAdminEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase() === ADMIN_EMAIL;
}

export async function requireAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/dashboard");
  if (!(await validateAppSession(user.id))) redirect("/auth/signout?reason=session-expired");
  return user;
}
