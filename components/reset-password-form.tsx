"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function passwordState(value: string) {
  const checks = {
    length: value.length >= 12,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9\s]/.test(value),
  };
  const count = Object.values(checks).filter(Boolean).length;
  return { checks, count, valid: count === 5, label: count <= 1 ? "Zwak" : count <= 3 ? "Redelijk" : count === 4 ? "Sterk" : "Zeer sterk" };
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = useMemo(() => passwordState(password), [password]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    if (!strength.valid) return setStatus("Je wachtwoord voldoet nog niet aan alle eisen.");
    if (password !== confirm) return setStatus("De wachtwoorden zijn niet hetzelfde.");

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setStatus("Wachtwoord wijzigen is niet gelukt. Open de resetlink uit je mail opnieuw.");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        Nieuw wachtwoord
        <span className="password-input">
          <input type={visible ? "text" : "password"} autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" onClick={() => setVisible((value) => !value)}>{visible ? "Verbergen" : "Tonen"}</button>
        </span>
      </label>

      <div className="strength" data-score={strength.count}>
        <div className="strength-head"><span>Wachtwoordsterkte</span><strong>{password ? strength.label : "Nog leeg"}</strong></div>
        <div className="strength-line"><span /><span /><span /><span /><span /></div>
        <div className="password-rules">
          <span data-ok={strength.checks.length}>✓ 12+ tekens</span><span data-ok={strength.checks.lower}>✓ kleine letter</span><span data-ok={strength.checks.upper}>✓ hoofdletter</span><span data-ok={strength.checks.number}>✓ cijfer</span><span data-ok={strength.checks.symbol}>✓ speciaal teken</span>
        </div>
      </div>

      <label>
        Wachtwoord nog een keer
        <input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        {confirm && <small className={password === confirm ? "match-ok" : "match-bad"}>{password === confirm ? "✓ Wachtwoorden komen overeen" : "✕ Wachtwoorden komen niet overeen"}</small>}
      </label>

      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? "Opslaan..." : "Nieuw wachtwoord opslaan"}</button>
      <p className={`auth-status ${status ? "show" : ""}`} aria-live="polite">{status}</p>
    </form>
  );
}
