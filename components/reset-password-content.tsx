"use client";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { usePreferences } from "@/components/preferences-provider";
export function ResetPasswordContent(){const {locale}=usePreferences();const c=locale==="en"?{tag:"Password",title:"New password",text:"Enter your new password twice."}:locale==="de"?{tag:"Passwort",title:"Neues Passwort",text:"Gib dein neues Passwort zweimal ein."}:{tag:"Wachtwoord",title:"Nieuw wachtwoord",text:"Vul je nieuwe wachtwoord twee keer in."};return <main className="page auth-page"><section className="auth-section"><div className="container auth-center"><div className="auth-card"><div className="auth-heading"><span>{c.tag}</span><h1>{c.title}</h1><p>{c.text}</p></div><ResetPasswordForm/></div></div></section></main>}
