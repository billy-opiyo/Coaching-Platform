"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useActionState } from "react";
import { unsubscribeFromMarketing, type UnsubscribeState } from "@/app/email/actions";

const initial: UnsubscribeState = { success: false, message: "" };

export function UnsubscribeForm() {
  const token = useSyncExternalStore((notify) => { window.addEventListener("hashchange", notify); return () => window.removeEventListener("hashchange", notify); }, () => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "", () => "");
  const [state, action, pending] = useActionState(unsubscribeFromMarketing, initial);
  const [started, setStarted] = useState(false);
  useEffect(() => { if (token) window.history.replaceState(null, "", window.location.pathname); }, [token]);
  return <form className="form-card" action={action} onSubmit={() => setStarted(true)}><p>Unsubscribe from optional educational emails. This does not affect transactional guide delivery or account messages.</p><input type="hidden" name="token" value={token}/>{!token && <div className="notice" role="status">Open the unsubscribe link from an email. The token is kept out of the address bar.</div>}{(state.message || started && pending) && <p className={state.success ? "lesson-callout" : "notice"} role="status">{state.message || "Updating your email preference…"}</p>}<button className="button button-dark" disabled={!token || pending}>{pending ? "Updating…" : "Unsubscribe"}</button></form>;
}
