"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Status = { type: "idle" | "loading" | "success" | "error"; text: string };
type PricingDetail = { packageName: string; addons: string[]; once: number; monthly: number };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ type: "idle", text: "" });
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    function fillFromPricing(event: Event) {
      const detail = (event as CustomEvent<PricingDetail>).detail;
      const form = formRef.current;
      if (!form || !detail) return;
      const type = form.elements.namedItem("type") as HTMLSelectElement | null;
      const message = form.elements.namedItem("message") as HTMLTextAreaElement | null;
      if (type) type.value = "Prijsaanvraag";
      if (message) {
        const addons = detail.addons.length ? detail.addons.join(", ") : "geen extra opties";
        message.value = `Ik wil graag een prijsaanvraag voor: ${detail.packageName}. Extra opties: ${addons}. Indicatie: €${detail.once} eenmalig${detail.monthly ? ` + €${detail.monthly}/mnd` : ""}.`;
      }
    }
    window.addEventListener("voidworks-pricing-selection", fillFromPricing);
    return () => window.removeEventListener("voidworks-pricing-selection", fillFromPricing);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus({ type: "loading", text: "Versturen..." });
    try {
      const response = await fetch("/api/contact", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Versturen is niet gelukt.");
      form.reset();
      setStatus({ type: "success", text: "Verstuurd. We nemen zo snel mogelijk contact met je op." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Versturen is niet gelukt. Mail anders naar info@voidworks.eu." });
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} ref={formRef}>
      <input className="honeypot" type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="field-row">
        <label>Naam<input type="text" name="name" minLength={2} maxLength={80} autoComplete="name" required placeholder="Jouw naam" /></label>
        <label>E-mail<input type="email" name="email" maxLength={160} autoComplete="email" required placeholder="naam@bedrijf.nl" /></label>
      </div>
      <label>
        Waar gaat het om?
        <select name="type" defaultValue="Nieuwe website">
          <option>Nieuwe website</option><option>Prijsaanvraag</option><option>Landing page</option><option>Website + admin panel</option><option>Webplatform / API</option><option>Website redesign</option><option>Hosting / onderhoud</option><option>Anders</option>
        </select>
      </label>
      <label>Vertel kort wat je nodig hebt<textarea name="message" minLength={10} maxLength={3000} rows={6} required placeholder="Wat wil je laten maken?" /></label>
      <button type="submit" className="button button-primary" disabled={status.type === "loading"}>{status.type === "loading" ? "Versturen..." : "Bericht versturen"}</button>
      <p className={`form-status ${status.type}`} aria-live="polite">{status.text}</p>
    </form>
  );
}
