"use client";

import { useActionState, useEffect, useSyncExternalStore } from "react";
import { requestPasswordReset, resetPassword, verifyEmail, type FormState } from "@/app/register/actions";

const empty: FormState = { success: false, message: "" };

export function PasswordRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, empty);
  return <form className="form-card" action={action}><p className="eyebrow">Password recovery</p><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required/>{state.message && <p role="status" className={state.success ? "lesson-callout" : "notice"}>{state.message}</p>}<button className="button button-dark" disabled={pending}>{pending ? "Sending…" : "Send reset instructions"}</button></form>;
}

export function PasswordResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, empty);
  return <form className="form-card" action={action}><p className="eyebrow">Choose a new password</p><input type="hidden" name="token" value={token}/><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required/>{state.message && <p role="status" className={state.success ? "lesson-callout" : "notice"}>{state.message}</p>}<button className="button button-dark" disabled={pending}>{pending ? "Updating…" : "Update password"}</button></form>;
}

export function EmailVerificationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmail, empty);
  return <form className="form-card" action={action}><p className="eyebrow">Email verification</p><input type="hidden" name="token" value={token}/><p>Confirm your email to finish setting up your account.</p>{state.message && <p role="status" className={state.success ? "lesson-callout" : "notice"}>{state.message}</p>}<button className="button button-dark" disabled={pending}>{pending ? "Verifying…" : "Verify email"}</button></form>;
}

export function TokenActionForm({ kind }: { kind: "verify" | "reset" }) {
  const token = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    },
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "",
    () => "",
  );
  useEffect(() => {
    if (token) window.history.replaceState(null, "", window.location.pathname);
  }, [token]);
  if (!token) return <div className="empty-state"><p>Open the secure link from your email. The link may expire after 30 minutes or after one use.</p></div>;
  return kind === "verify" ? <EmailVerificationForm token={token}/> : <PasswordResetForm token={token}/>;
}
