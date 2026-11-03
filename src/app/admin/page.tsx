import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/site-shell";
import { requireAdmin } from "@/lib/security";
import { getPrisma } from "@/lib/prisma";

export const metadata = { title: "Administration", robots: { index: false, follow: false } };

export default function AdminHomePage() {
  return <main className="page-main"><header className="admin-header"><Link className="wordmark" href="/"><span className="wordmark-mark" aria-hidden="true">C</span>Coaching Platform</Link><nav aria-label="Administration"><Link href="/admin/content">Learning content</Link><Link href="/admin/resources">External tools</Link></nav></header><Suspense fallback={<LoadingBlock label="Loading the content workspace…"/>}><AdminOverview/></Suspense></main>;
}

async function AdminOverview() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  const db = getPrisma();
  const [paths, lessons, tools] = await Promise.all([db.learningPath.count(), db.lesson.count(), db.externalResource.count()]);
  return <section className="content-wrap"><p className="eyebrow">Administration</p><h1 className="admin-title">Content workspace</h1><p className="admin-lead">Manage learning resources and external tools. Private member records are not part of content administration.</p><div className="admin-metrics"><article><span>Learning paths</span><strong>{paths}</strong></article><article><span>Lessons</span><strong>{lessons}</strong></article><article><span>External tools</span><strong>{tools}</strong></article></div><div className="admin-links"><Link className="info-card" href="/admin/content"><h2>Learning content</h2><p>Create, revise, and publish learning paths and lessons.</p><span className="text-link">Manage content →</span></Link><Link className="info-card" href="/admin/resources"><h2>External tools directory</h2><p>Curate safe links and record compatibility, cost, and privacy notes.</p><span className="text-link">Manage tools →</span></Link>{admin.role === "PLATFORM_ADMIN" && <Link className="info-card" href="/admin/squads"><h2>Squad operations</h2><p>Manage opt-in groups and review member safety reports.</p><span className="text-link">Manage squads →</span></Link>}</div></section>;
}
