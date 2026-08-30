"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { usePreferences } from "@/components/preferences-provider";

export function SignOutButton() {
  const router = useRouter();
  const { locale } = usePreferences();
  const [busy, setBusy] = useState(false);
  const label = locale === "en" ? "Log out" : locale === "de" ? "Abmelden" : "Uitloggen";
  const busyLabel = locale === "en" ? "Logging out..." : locale === "de" ? "Abmelden..." : "Uitloggen...";
  return <button className="button button-secondary" disabled={busy} onClick={async () => { setBusy(true); const supabase=createClient(); await supabase.auth.signOut(); router.push("/"); router.refresh(); }}>{busy?busyLabel:label}</button>;
}
