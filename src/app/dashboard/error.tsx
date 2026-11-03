"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="content-wrap"><div className="notice" role="alert"><h1>We could not load your member space</h1><p>Your account data was not changed. Check your connection and try again, or contact support if the problem continues.</p><button className="button button-dark" onClick={reset}>Try again</button></div></section>;
}
