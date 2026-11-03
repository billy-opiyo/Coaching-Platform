import Link from "next/link";
import { PageFrame, PageHeading } from "@/components/site-shell";
import { TokenActionForm } from "@/components/account-action-form";

export const metadata = { title: "Verify email", robots: { index: false, follow: false } };
export default function VerifyEmailPage() { return <PageFrame><main className="page-main"><PageHeading eyebrow="Account access" title="Verify your email." description="Email verification links expire after 30 minutes and can only be used once."/><section className="content-wrap"><TokenActionForm kind="verify"/><p style={{marginTop:18}}><Link className="text-link" href="/register">Return to registration</Link></p></section></main></PageFrame>; }
