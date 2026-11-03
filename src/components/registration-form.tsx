"use client";

import { useActionState } from "react";
import { registerAccount, type FormState } from "@/app/register/actions";

const initialState: FormState = { success: false, message: "" };

export function RegistrationForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(registerAccount, initialState);
  if (!enabled) return <div className="form-card"><p className="eyebrow">Registration paused</p><h2>Accounts are not open yet.</h2><p className="notice">Registration will open after the privacy notice, terms, support process, database, and verified email delivery are approved and configured.</p><p style={{fontSize:12,color:"#64748b"}}>You can read public learning resources without an account.</p></div>;
  return <form className="form-card" action={action}>
    <p className="eyebrow">Create a member account</p>
    <label htmlFor="name">Name <span style={{fontWeight:400,color:"#64748b"}}>(optional)</span></label><input autoComplete="name" id="name" name="name" maxLength={80}/>
    <label htmlFor="email">Email address</label><input autoComplete="email" id="email" name="email" type="email" maxLength={254} required/>
    <label htmlFor="password">Password</label><input autoComplete="new-password" id="password" name="password" type="password" minLength={12} maxLength={72} required/><p style={{margin:"7px 0 0",fontSize:11,color:"#64748b"}}>Use at least 12 characters.</p>
    {state.message && <p className={state.success ? "lesson-callout" : "notice"} role="status">{state.message}</p>}
    <button className="button button-dark" type="submit" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
    <p style={{fontSize:12,color:"#64748b"}}>Marketing email consent is not part of this form. See the <a href="/privacy">privacy page</a>.</p>
  </form>;
}
