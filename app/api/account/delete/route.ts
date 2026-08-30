import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data:{ user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error:"Not authenticated" }, { status:401 });

    const admin = createAdminClient();
    const { error:deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) return NextResponse.json({ error:deleteError.message }, { status:500 });

    await supabase.auth.signOut({ scope:"local" });
    return NextResponse.json({ ok:true });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "Delete failed" }, { status:500 });
  }
}
