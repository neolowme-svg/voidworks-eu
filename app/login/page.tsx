import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Inloggen", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <main className="page auth-page"><section className="auth-section"><div className="container auth-center"><Suspense fallback={<div className="auth-card auth-loading">Laden...</div>}><LoginForm /></Suspense></div></section></main>;
}
