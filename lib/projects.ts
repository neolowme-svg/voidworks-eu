import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function linkProjectRequestsToUser(user: User) {
  if (!user.email) return 0;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("link_project_requests_to_user", { p_user_id:user.id, p_email:user.email });
    if (error) return 0;
    return Number(data || 0);
  } catch { return 0; }
}

export function projectReplyAddress(projectId: string) {
  const domain = (process.env.RESEND_INBOUND_DOMAIN || "").trim().toLowerCase();
  return domain ? `project+${projectId}@${domain}` : null;
}
