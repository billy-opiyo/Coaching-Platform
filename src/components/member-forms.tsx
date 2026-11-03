"use client";

import { useActionState } from "react";
import { cancelAccountDeletion, requestAccountDeletion, updateProfile, type MemberFormState } from "@/app/dashboard/actions";

const initial: MemberFormState = { success: false, message: "" };

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return <form className="form-card" action={action}>
    <label htmlFor="display-name">Display name</label><input id="display-name" name="name" type="text" autoComplete="name" maxLength={80} defaultValue={name} aria-describedby="display-name-help"/>
    <p id="display-name-help" className="member-field-help">Optional. Up to 80 characters.</p>
    {state.message && <p role="status" className={state.success ? "lesson-callout" : "notice"}>{state.message}</p>}
    <button className="button button-dark" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
  </form>;
}

export function DeletionRequestForm() {
  const [state, action, pending] = useActionState(requestAccountDeletion, initial);
  return <form className="form-card" action={action}>
    <p>To request deletion, type <strong>DELETE</strong>. The request is recorded for follow-up and can be cancelled here.</p>
    <input type="hidden" name="intent" value="request"/>
    <label htmlFor="delete-confirmation">Confirmation</label><input id="delete-confirmation" name="confirmation" required autoComplete="off"/>
    {state.message && <p role="status" className={state.success ? "lesson-callout" : "notice"}>{state.message}</p>}
    <button className="button button-dark" disabled={pending}>{pending ? "Submitting…" : "Request account deletion"}</button>
  </form>;
}

export function CancelDeletionForm() {
  return <form action={cancelAccountDeletion}><button className="button button-dark" type="submit">Cancel request</button></form>;
}
