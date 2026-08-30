"use client";

import { usePreferences } from "@/components/preferences-provider";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

export function BotChallenge({ onToken }: { onToken: (token: string) => void }) {
  const { text } = usePreferences();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const root = useRef<HTMLDivElement | null>(null);
  const widget = useRef<string>("");
  const id = useId().replace(/:/g, "");

  function render() {
    if (!siteKey || !root.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(root.current, {
      sitekey: siteKey,
      theme: "auto",
      size: "flexible",
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }

  useEffect(() => {
    render();
    return () => {
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={render} />
    <div id={`turnstile-${id}`} className="turnstile-wrap" ref={root} aria-label={text.auth.botProtection} />
  </>;
}
