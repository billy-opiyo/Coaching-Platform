import Link from "next/link";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/site-shell";
import { getPrisma } from "@/lib/prisma";
import { getPublishedPaths } from "@/lib/published-content";
import { requireUser } from "@/lib/security";

export default function DashboardPage() {
  return <Suspense fallback={<LoadingBlock label="Loading your dashboard…"/>}><DashboardContent/></Suspense>;
}

async function DashboardContent() {
  const user = await requireUser();
  if (!user) return null;
  const [paths, completedCount, recentCheckIn] = await Promise.all([
    getPublishedPaths(),
    getPrisma().lessonProgress.count({ where: { userId: user.id } }),
    getPrisma().trackerEntry.findFirst({ where: { userId: user.id }, orderBy: { entryDate: "desc" }, select: { entryDate: true, mood: true, energy: true, stress: true } }),
  ]);
  const totalLessons = paths.reduce((total, path) => total + path.lessons.length, 0);
  return <>
    <section className="page-heading member-heading"><p className="eyebrow">Your dashboard</p><h1>Take the next useful step.</h1><p className="lead">A private place to continue learning and manage your account. Keep only the information that is useful to you.</p></section>
    <section className="content-wrap member-dashboard-content">
      <div className="member-feature-grid">
        <article className="member-feature member-feature-primary"><p className="eyebrow eyebrow-light">Learning progress</p><h2>{completedCount} of {totalLessons} lessons complete</h2><p>Your progress is private to your account. You can change it any time.</p><Link className="button button-light" href="/dashboard/learning">Continue learning</Link></article>
        <article className="member-feature"><p className="eyebrow">Account</p><h2>{user.role === "FREE_MEMBER" ? "Free member" : "Member access"}</h2><p>{user.email}</p><Link className="text-link" href="/dashboard/settings">Manage account →</Link></article>
      </div>
      <div className="member-later-grid" aria-label="Member tools">
        <article className="info-card"><h2>Daily check-in</h2><p>{recentCheckIn ? `Your latest check-in was ${recentCheckIn.entryDate.toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" })}.` : "Add an optional private reflection about today."} Scores and notes are visible only to you.</p><Link className="text-link" href="/dashboard/tracker">Open your tracker →</Link></article>
        <article className="info-card"><h2>Two-minute pause</h2><p>Use an optional text-first grounding sequence. It does not save protocol activity.</p><Link className="text-link" href="/dashboard/protocol">Open the exercise →</Link></article>
        <article className="info-card"><h2>Accountability squads</h2><p>Join a group only when community guidelines are approved and participation is open.</p><Link className="text-link" href="/dashboard/squads">View squad status →</Link></article>
        <article className="info-card"><h2>Coaching and groups</h2><p>Bookings and optional accountability groups are not active. No paid feature is presented as available.</p><span className="status-badge">Not available yet</span></article>
      </div>
    </section>
  </>;
}
