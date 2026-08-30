"use client";

import { usePreferences } from "@/components/preferences-provider";

export function RouteLoading() {
  const { text } = usePreferences();
  return <div className="route-loading" role="status" aria-label={text.nav.loading}><span aria-hidden="true" /></div>;
}
