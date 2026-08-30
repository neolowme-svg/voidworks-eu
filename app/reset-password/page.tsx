import type { Metadata } from "next";
import { ResetPasswordContent } from "@/components/reset-password-content";
export const metadata: Metadata={title:"Nieuw wachtwoord",robots:{index:false,follow:false}};
export default function ResetPasswordPage(){return <ResetPasswordContent/>}
