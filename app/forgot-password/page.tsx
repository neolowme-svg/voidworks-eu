import type {Metadata} from "next";
import {ForgotPasswordForm} from "@/components/forgot-password-form";
export const metadata:Metadata={title:"Forgot password",robots:{index:false,follow:false}};
export default function ForgotPasswordPage(){return <main className="page auth-page"><section className="auth-section"><div className="container auth-shell"><ForgotPasswordForm/></div></section></main>}
