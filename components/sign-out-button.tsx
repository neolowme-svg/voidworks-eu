"use client";
import { useState } from "react";
import { usePreferences } from "@/components/preferences-provider";
export function SignOutButton(){const{text}=usePreferences();const[busy,setBusy]=useState(false);return <button type="button" className="button button-secondary" disabled={busy} onClick={()=>{setBusy(true);window.location.href="/auth/signout"}}>{busy?"…":text.dashboard.logout}</button>}
