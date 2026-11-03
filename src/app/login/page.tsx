import Link from "next/link";
import { Suspense } from "react";
import { PageFrame, PageHeading } from "@/components/site-shell";
import { loginAction } from "./actions";
import { isAuthConfigured } from "@/lib/auth-config";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };
export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <PageFrame><main className="page-main"><Suspense fallback={<section className="content-wrap"><div className="empty-state" role="status">Loading sign-in…</div></section>}><LoginContent searchParams={searchParams}/></Suspense></main></PageFrame>;
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const enabled = isAuthConfigured();
  return <><PageHeading eyebrow="Member access" title="Welcome back." description="Sign in to continue to your member space."/><section className="content-wrap">{enabled ? <form className="form-card" action={loginAction}><p className="eyebrow">Sign in</p>{error === "credentials" && <p className="notice" role="alert">We couldn’t sign you in. Check your details and email verification, then try again.</p>}<label htmlFor="email">Email address</label><input autoComplete="email" id="email" name="email" type="email" maxLength={254} required/><label htmlFor="password">Password</label><input autoComplete="current-password" id="password" name="password" type="password" required/><button className="button button-dark" type="submit">Sign in securely</button><p style={{fontSize:12,color:"#64748b"}}><Link href="/forgot-password">Forgot your password?</Link></p><p style={{fontSize:12,color:"#64748b"}}>New here? <Link href="/register">Create an account</Link></p></form> : <div className="form-card"><p className="eyebrow">Sign in paused</p><h2>Member access isn’t configured yet.</h2><p className="notice">Authentication opens after the database and session secret are configured. Registration also requires approved privacy/terms and verified email delivery.</p><Link className="text-link" href="/resources">Browse public resources <span aria-hidden="true">→</span></Link></div>}</section></>;
}
