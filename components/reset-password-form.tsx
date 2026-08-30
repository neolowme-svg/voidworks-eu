"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function score(value: string) {
  const checks = [
    value.length >= 12,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9\s]/.test(value),
  ];
  return checks.filter(Boolean).length;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = useMemo(() => score(password), [password]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (strength < 5) {
      setStatus("Gebruik 12+ tekens, hoofdletter, kleine letter, cijfer en speciaal teken.");
      return;
    }

    if (password !== confirm) {
      setStatus("De wachtwoorden zijn niet hetzelfde.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setStatus("Wachtwoord wijzigen is niet gelukt. Open de resetlink uit je mail opnieuw.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        Nieuw wachtwoord
        <span className="password-input">
          <input
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            minLength={12}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="button" onClick={() => setVisible((value) => !value)}>
            {visible ? "Verbergen" : "Tonen"}
          </button>
        </span>
      </label>

      <div className="strength compact" data-level={Math.min(4, strength)}>
        <div className="strength-line">
          <span /><span /><span /><span />
        </div>
      </div>

      <label>
        Wachtwoord nog een keer
        <input
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </label>

      <button className="button button-primary auth-submit" type="submit" disabled={busy}>
        {busy ? "Opslaan..." : "Nieuw wachtwoord opslaan"}
      </button>

      <p className={`auth-status ${status ? "show" : ""}`} aria-live="polite">
        {status}
      </p>
    </form>
  );
}
