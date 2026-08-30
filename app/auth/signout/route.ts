import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revokeCurrentAppSession } from "@/lib/security/session";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await revokeCurrentAppSession();
  await supabase.auth.signOut({ scope:"local" });
  const url = new URL("/login", request.url);
  const reason = request.nextUrl.searchParams.get("reason");
  if (reason === "session-expired" || reason === "account-missing") url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}
