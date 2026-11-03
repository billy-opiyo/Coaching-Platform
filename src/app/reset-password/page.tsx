import Link from "next/link";
import { PageFrame, PageHeading } from "@/components/site-shell";
import { TokenActionForm } from "@/components/account-action-form";

export const metadata = { title: "Set a new password", robots: { index: false, follow: false } };
export default function ResetPasswordPage() { return <PageFrame><main className="page-main"><PageHeading eyebrow="Account access" title="Choose a new password." description="Reset links expire after 30 minutes and can only be used once."/><section className="content-wrap"><TokenActionForm kind="reset"/><p style={{marginTop:18}}><Link className="text-link" href="/forgot-password">Request another link</Link></p></section></main></PageFrame>; }
