"use client";

import { useActionState } from "react";
import { requestBlueprint, type BlueprintFormState } from "@/app/blueprint/actions";

const initial: BlueprintFormState = { success: false, message: "" };

export function BlueprintCaptureForm({ marketingEnabled }: { marketingEnabled: boolean }) {
  const [state, action, pending] = useActionState(requestBlueprint, initial);
  return <form className="form-card" action={action}>
    <p className="eyebrow">Get the guide</p>
    <label htmlFor="blueprint-email">Email address</label><input id="blueprint-email" name="email" type="email" maxLength={254} autoComplete="email" required/>
    {marketingEnabled && <label className="checkbox-field"><input name="marketingConsent" type="checkbox" value="yes"/><span>I also agree to receive optional educational email updates. This is separate from requesting the guide; I can unsubscribe at any time.</span></label>}
    <p className="member-field-help">Your email will be used to deliver the requested guide. Optional updates are sent only if you select the separate checkbox. See the <a className="text-link" href="/privacy">privacy information</a>.</p>
    {state.message && <p role="status" className={state.success ? "lesson-callout" : "notice"}>{state.message}</p>}
    <button className="button button-dark" disabled={pending}>{pending ? "Submitting…" : "Email me the guide"}</button>
  </form>;
}
