import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Coaching Platform home">
        <span className="wordmark-mark" aria-hidden="true">C</span>
        <span>Coaching Platform</span>
      </Link>
      <nav className="site-nav" aria-label="Main navigation">
        <Link href="/about">About</Link>
        <Link href="/resources">Resources</Link>
        <Link href="/coaching">Coaching</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/login">Sign in</Link>
      </nav>
      <details className="mobile-menu"><summary>Menu <span aria-hidden="true">⌄</span></summary><nav aria-label="Mobile main navigation"><Link href="/about">About</Link><Link href="/resources">Resources</Link><Link href="/coaching">Coaching</Link><Link href="/pricing">Pricing</Link><Link href="/login">Sign in</Link><Link href="/blueprint">Free Blueprint</Link></nav></details>
      <Link className="button button-small" href="/blueprint">Get the free guide <span aria-hidden="true">↗</span></Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div><Link className="wordmark footer-wordmark" href="/"><span className="wordmark-mark" aria-hidden="true">C</span><span>Coaching Platform</span></Link><p>Practical learning and supportive next steps, at your own pace.</p></div>
        <div className="footer-links"><Link href="/resources">Resources</Link><Link href="/coaching">Coaching</Link><Link href="/contact">Contact</Link></div>
      </div>
      <div className="footer-bottom"><span>Educational resources; not a substitute for professional care.</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund-policy">Refunds</Link></div></div>
    </footer>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}

export function LoadingBlock({ label }: { label: string }) {
  return <div className="empty-state" role="status">{label}</div>;
}

export function PageHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return <div className="page-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="lead">{description}</p></div>;
}
