"use client";

import { usePreferences } from "@/components/preferences-provider";

export function SkipLink() {
  const { text } = usePreferences();
  return <a className="skip-link" href="#main-content">{text.nav.skip}</a>;
}
