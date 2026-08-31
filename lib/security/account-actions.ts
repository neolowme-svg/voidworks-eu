import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sixDigitCode, hashSecret } from "@/lib/security/crypto";
import { ACTION_CODE_MINUTES } from "@/lib/security/config";

export type AccountAction = "delete_account" | "change_password" | "change_profile" | "password_reset";

export async function issueAccountActionCode(user: User, action: AccountAction) {
  const code = sixDigitCode();
  const admin = createAdminClient();
  const { error } = await admin.from("account_action_codes").upsert({
    user_id:user.id,
    action,
    code_hash:hashSecret(code, `account-action:${action}`),
    expires_at:new Date(Date.now()+ACTION_CODE_MINUTES*60_000).toISOString(),
    attempts:0,
    consumed_at:null,
    last_sent_at:new Date().toISOString(),
  }, { onConflict:"user_id,action" });
  if (error) throw new Error("ACTION_CODE_STORE_FAILED");
  return code;
}

export async function consumeAccountActionCode(userId:string, action:AccountAction, code:string) {
  if (!/^\d{6}$/.test(code)) return "invalid" as const;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_account_action_code", {
    p_user_id:userId,
    p_action:action,
    p_code_hash:hashSecret(code, `account-action:${action}`),
  });
  if (error) throw new Error("ACTION_CODE_VERIFY_FAILED");
  return String(data || "invalid") as "ok"|"invalid"|"expired"|"locked";
}
