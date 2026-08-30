import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
export const metadata: Metadata = { title: "Terms" };
export default function Page(){return <LegalPage kind="terms"/>;}
