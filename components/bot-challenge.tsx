"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";
import { usePreferences } from "@/components/preferences-provider";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

export function BotChallenge({
  onToken,
  onReady,
  action,
}: {
  onToken: (token: string) => void;
  onReady?: (ready: boolean) => void;
  action: "login" | "register" | "password_reset" | "contact";
}) {
  const { text, locale } = usePreferences();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const root = useRef<HTMLDivElement | null>(null);
  const widget = useRef<string>("");
  const id = useId().replace(/:/g, "");

  function renderWidget() {
    if (!siteKey) {
      onReady?.(true);
      return;
    }
    if (!root.current || !window.turnstile || widget.current) return;

    onToken("");
    onReady?.(false);
    widget.current = window.turnstile.render(root.current, {
      sitekey: siteKey,
      theme: "auto",
      language: locale,
      size: "flexible",
      action,
      callback: (token: string) => {
        onToken(token);
        onReady?.(Boolean(token));
      },
      "expired-callback": () => {
        onToken("");
        onReady?.(false);
      },
      "timeout-callback": () => {
        onToken("");
        onReady?.(false);
      },
      "error-callback": () => {
        onToken("");
        onReady?.(false);
      },
    });
  }

  useEffect(() => {
    if (widget.current && window.turnstile) {
      window.turnstile.remove(widget.current);
      widget.current = "";
    }
    renderWidget();
    return () => {
      onToken("");
      onReady?.(false);
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = "";
    };
    // Parent controls remounts through key after every server validation attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, locale, action]);

  if (!siteKey) return null;
  return <>
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      onLoad={renderWidget}
      onReady={renderWidget}
    />
    <div id={`turnstile-${id}`} className="turnstile-wrap" ref={root} aria-label={text.auth.botProtection} />
  </>;
}
