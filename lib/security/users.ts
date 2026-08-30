import { createAdminClient } from "@/lib/supabase/admin";

export async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  const needle = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("User lookup failed");
    const found = data.users.find((user) => (user.email || "").toLowerCase() === needle);
    if (found) return found;
    if (data.users.length < 1000) break;
  }
  return null;
}
