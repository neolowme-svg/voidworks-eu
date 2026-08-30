import type { Metadata } from "next";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Account maken", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return <main className="page auth-page"><section className="auth-section"><div className="container auth-center"><RegisterForm /></div></section></main>;
}
