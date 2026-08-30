"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { usePreferences } from "@/components/preferences-provider";

type Status = { type: "idle" | "loading" | "success" | "error"; text: string };
type PricingDetail = { packageName: string; addons: string[]; once: number; monthly: number };

export function ContactForm() {
  const { text } = usePreferences();
  const [status, setStatus] = useState<Status>({ type:"idle", text:"" });
  const [type, setType] = useState(text.contact.options[0]);
  const [prefill, setPrefill] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => { setType(text.contact.options[0]); }, [text.contact.options]);
  useEffect(() => {
    function fillFromPricing(event: Event) {
      const detail = (event as CustomEvent<PricingDetail>).detail;
      if (!detail) return;
      const priceRequest = text.contact.options[1];
      setType(priceRequest);
      const addons = detail.addons.length ? detail.addons.join(", ") : "—";
      setPrefill(`${detail.packageName}. ${text.pricing.extras}: ${addons}. ${text.pricing.once}: €${detail.once}${detail.monthly ? ` + €${detail.monthly}${text.pricing.perMonth}` : ""}.`);
    }
    window.addEventListener("voidworks-pricing-selection", fillFromPricing);
    return () => window.removeEventListener("voidworks-pricing-selection", fillFromPricing);
  }, [text]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus({ type:"loading", text:text.contact.sending });
    try {
      const response = await fetch("/api/contact", { method:"POST", body:data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error");
      form.reset(); setPrefill(""); setType(text.contact.options[0]);
      setStatus({ type:"success", text:text.contact.success });
    } catch (error) {
      setStatus({ type:"error", text:error instanceof Error ? error.message : "info@voidworks.eu" });
    }
  }

  const options = text.contact.options.map((label) => ({ value:label, label }));
  return <form className="contact-form" onSubmit={submit} ref={formRef}>
    <input className="honeypot" type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="field-row"><label>{text.contact.name}<input type="text" name="name" minLength={2} maxLength={80} autoComplete="name" required placeholder={text.contact.placeholderName} /></label><label>{text.contact.email}<input type="email" name="email" maxLength={160} autoComplete="email" required placeholder={text.contact.placeholderEmail} /></label></div>
    <label>{text.contact.subject}<CustomSelect name="type" value={type} onChange={setType} options={options} placeholder={text.contact.select} /></label>
    <label>{text.contact.message}<textarea name="message" minLength={10} maxLength={3000} rows={6} required placeholder={text.contact.placeholderMessage} value={prefill} onChange={(event) => setPrefill(event.target.value)} /></label>
    <button type="submit" className="button button-primary" disabled={status.type === "loading"}>{status.type === "loading" ? text.contact.sending : text.contact.send}</button>
    <p className={`form-status ${status.type}`} aria-live="polite">{status.text}</p>
  </form>;
}
