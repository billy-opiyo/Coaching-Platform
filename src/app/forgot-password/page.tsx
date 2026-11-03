import { PageFrame, PageHeading } from "@/components/site-shell";
import { PasswordRequestForm } from "@/components/account-action-form";

export const metadata = { title: "Forgot password", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <PageFrame><main className="page-main"><PageHeading eyebrow="Account access" title="Reset your password." description="If an account matches the address you enter, we’ll send password-reset instructions."/><section className="content-wrap"><PasswordRequestForm/></section></main></PageFrame>; }
