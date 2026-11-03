"use client";

import { useActionState } from "react";
import { updateEmailStep, type EmailActionState } from "@/app/admin/email/actions";

const initial: EmailActionState = { success: false, message: "" };

export function EmailStepForm({ step }: { step: { id: string; stepNumber: number; delayDays: number; subject: string; bodyText: string; isEnabled: boolean } }) {
  const [state, action, pending] = useActionState(updateEmailStep, initial);
  return <form className="admin-edit-form email-step-form" action={action}>
    <input type="hidden" name="id" value={step.id}/>
    <h3>Email {step.stepNumber}</h3>
    <label>Send after (days)<input type="number" name="delayDays" min={0} max={30} defaultValue={step.delayDays} required/></label>
    <label>Subject<input name="subject" maxLength={180} defaultValue={step.subject} required/></label>
    <label className="form-span">Plain-text email body<textarea name="bodyText" minLength={30} maxLength={10000} defaultValue={step.bodyText} required/></label>
    <label className="email-enabled"><input type="checkbox" name="isEnabled" value="true" defaultChecked={step.isEnabled}/> Enable this step</label>
    {state.message && <p className={state.success ? "lesson-callout" : "notice"} role="status">{state.message}</p>}
    <button className="button button-small button-dark" disabled={pending}>{pending ? "Saving…" : "Save email step"}</button>
  </form>;
}
