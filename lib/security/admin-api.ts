import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/security/admin";
import { validateAppSession } from "@/lib/security/session";

export async function getAuthorizedAdmin() {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  if (!(await validateAppSession(user.id))) return null;
  return user;
}

export function safeBackupName(value: string) {
  return /^voidworks-[A-Za-z0-9T_.-]+\.sql$/.test(value) && !value.includes("..") && !value.includes("/");
}
