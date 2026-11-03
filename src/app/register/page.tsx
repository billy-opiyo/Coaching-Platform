import Link from "next/link";
import { PageFrame, PageHeading } from "@/components/site-shell";
import { RegistrationForm } from "@/components/registration-form";
import { isSignupAvailable } from "@/lib/auth-config";

export const metadata = { title: "Create an account", robots: { index: false, follow: false } };
export default function RegisterPage() { return <PageFrame><main className="page-main"><PageHeading eyebrow="Member access" title="A space of your own." description="Create an account when registration opens to access member tools and track learning progress."/><section className="content-wrap"><RegistrationForm enabled={isSignupAvailable()}/><p style={{fontSize:12,color:"#64748b",marginTop:16}}>Already have an account? <Link href="/login">Sign in</Link></p></section></main></PageFrame>; }
