import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const url = new URL("/login", request.url);
  url.searchParams.set("reason", "account-removed");
  return NextResponse.redirect(url);
}
