"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

export default function BlueprintAccessPage() {
  const token = useSyncExternalStore((notify) => { window.addEventListener("hashchange", notify); return () => window.removeEventListener("hashchange", notify); }, () => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "", () => "");
  const [message, setMessage] = useState("");
  useEffect(() => { if (token) window.history.replaceState(null, "", window.location.pathname); }, [token]);

  async function download() {
    if (!token) return;
    setMessage("Preparing your private download…");
    try {
      const response = await fetch("/api/blueprint/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      if (!response.ok) throw new Error("That download link is invalid or expired.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "7-day-blueprint.pdf";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setMessage("Your download is ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The download could not be prepared. Request a new link.");
    }
  }

  return <main className="page-main"><section className="page-heading"><p className="eyebrow">Private guide access</p><h1>Your 7-Day Blueprint</h1><p className="lead">This secure link expires 48 hours after it was sent.</p></section><section className="content-wrap"><div className="form-card">{token ? <><p>Use the button to retrieve the private PDF. The download link is not stored in the address bar.</p><button className="button button-dark" onClick={download}>Download the guide</button></> : <div className="notice" role="status">Open the secure link from your delivery email. It may have expired after 48 hours.</div>}{message && <p className="lesson-callout" role="status">{message}</p>}<p><Link className="text-link" href="/resources">Browse public resources →</Link></p></div></section></main>;
}
