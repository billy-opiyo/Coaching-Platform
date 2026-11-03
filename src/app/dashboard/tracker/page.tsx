import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { LoadingBlock } from "@/components/site-shell";
import { TrackerEntryForm } from "@/components/tracker-entry-form";
import { deleteTrackerEntry } from "@/app/dashboard/tracker/actions";
import { getPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

type Search = Promise<{ period?: string; edit?: string; page?: string }>;

export default function TrackerPage({ searchParams }: { searchParams: Search }) {
  return <Suspense fallback={<LoadingBlock label="Loading your private check-ins…"/>}><TrackerContent searchParams={searchParams}/></Suspense>;
}

async function TrackerContent({ searchParams }: { searchParams: Search }) {
  const user = await requireUser();
  if (!user) return null;
  const params = await searchParams;
  const period = params.period === "month" ? "month" : params.period === "all" ? "all" : "week";
  const requestedPage = period === "all" && /^\d+$/.test(params.page ?? "") ? Math.max(0, Math.min(10000, Number(params.page))) : 0;
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (period === "week" ? 6 : 29)));
  const where = { userId: user.id, ...(period === "all" ? {} : { entryDate: { gte: start } }) };
  const totalEntries = period === "all" ? await getPrisma().trackerEntry.count({ where }) : null;
  const pageNumber = totalEntries === null ? 0 : Math.min(requestedPage, Math.max(0, Math.ceil(totalEntries / 30) - 1));
  const [entries, editEntry] = await Promise.all([
    getPrisma().trackerEntry.findMany({ where, orderBy: { entryDate: "desc" }, ...(period === "all" ? { skip: pageNumber * 30, take: 30 } : {}) }),
    params.edit ? getPrisma().trackerEntry.findFirst({ where: { id: params.edit, userId: user.id } }) : null,
  ]);
  if (params.edit && !editEntry) notFound();
  const averages = entries.length ? {
    mood: entries.reduce((sum, item) => sum + item.mood, 0) / entries.length,
    energy: entries.reduce((sum, item) => sum + item.energy, 0) / entries.length,
    stress: entries.reduce((sum, item) => sum + item.stress, 0) / entries.length,
  } : null;
  const todayString = new Date().toISOString().slice(0, 10);
  return <>
    <section className="page-heading member-heading"><p className="eyebrow">Private tracker</p><h1>Notice your patterns.</h1><p className="lead">Record a short check-in, revisit what you wrote, and view summaries from your own entries. These reflections are for you, not a diagnosis.</p></section>
    <section className="content-wrap tracker-layout">
      <TrackerEntryForm today={todayString} entry={editEntry ? { id: editEntry.id, entryDate: editEntry.entryDate.toISOString().slice(0, 10), mood: editEntry.mood, energy: editEntry.energy, stress: editEntry.stress, reflection: editEntry.reflection } : undefined}/>
      <div className="tracker-summary">
        <section className="info-card"><p className="eyebrow">Your history</p><h2>{period === "week" ? "Last 7 days" : period === "month" ? "Last 30 days" : "All check-ins"}</h2><div className="tracker-period-links"><Link aria-current={period === "week" ? "page" : undefined} href="/dashboard/tracker?period=week">7 days</Link><Link aria-current={period === "month" ? "page" : undefined} href="/dashboard/tracker?period=month">30 days</Link><Link aria-current={period === "all" ? "page" : undefined} href="/dashboard/tracker?period=all">All history</Link></div>
          {entries.length === 0 ? <div className="empty-state"><p>No check-ins in this period yet. Add one whenever it feels useful.</p></div> : <>
            <p className="tracker-entry-count">{period === "all" ? `${totalEntries} total · showing ${pageNumber * 30 + 1}–${pageNumber * 30 + entries.length}` : entries.length} {period === "all" ? "" : entries.length === 1 ? "entry" : "entries"} · averages are calculated from the entries shown</p>
            {averages && <div className="tracker-averages"><span>Mood <strong>{averages.mood.toFixed(1)}</strong></span><span>Energy <strong>{averages.energy.toFixed(1)}</strong></span><span>Stress <strong>{averages.stress.toFixed(1)}</strong></span></div>}
            <p className="tracker-chart-legend"><span className="mood-dot"/>Mood <span className="energy-dot"/>Energy <span className="stress-dot"/>Stress</p>
            <div className="tracker-chart" role="group" aria-label="Scores from your check-ins, each measured from 1 to 5">{entries.slice().reverse().map((entry) => <div className="tracker-chart-row" key={entry.id}>
              <time dateTime={entry.entryDate.toISOString().slice(0, 10)}>{entry.entryDate.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}</time>
              <span aria-label={`Mood ${entry.mood} of 5`} className="tracker-bar mood" style={{ "--bar-width": `${entry.mood * 20}%` } as CSSProperties}/>
              <span aria-label={`Energy ${entry.energy} of 5`} className="tracker-bar energy" style={{ "--bar-width": `${entry.energy * 20}%` } as CSSProperties}/>
              <span aria-label={`Stress ${entry.stress} of 5`} className="tracker-bar stress" style={{ "--bar-width": `${entry.stress * 20}%` } as CSSProperties}/>
            </div>)}</div>
          </>}
        </section>
        <section className="info-card"><p className="eyebrow">{period === "all" ? "Saved check-ins" : "Entries in this period"}</p><h2>Private to your account</h2>{entries.length === 0 ? <p>Your check-ins will appear here.</p> : <div className="tracker-entry-list">{entries.map((entry) => <article className="tracker-entry" key={entry.id}><div><h3>{entry.entryDate.toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" })}</h3><p>Mood {entry.mood}/5 · Energy {entry.energy}/5 · Stress {entry.stress}/5</p>{entry.reflection && <p className="tracker-reflection">{entry.reflection}</p>}</div><div className="tracker-entry-actions"><Link className="text-link" href={`/dashboard/tracker?period=${period}&${period === "all" ? `page=${pageNumber}&` : ""}edit=${encodeURIComponent(entry.id)}`}>Edit</Link><form action={deleteTrackerEntry}><input type="hidden" name="entryId" value={entry.id}/><button className="button button-small button-outline-dark" type="submit">Delete</button></form></div></article>)}</div>}{period === "all" && <nav className="tracker-pagination" aria-label="Check-in history pages">{pageNumber > 0 && <Link href={`/dashboard/tracker?period=all&page=${pageNumber - 1}`}>Newer entries</Link>}{totalEntries !== null && (pageNumber + 1) * 30 < totalEntries && <Link href={`/dashboard/tracker?period=all&page=${pageNumber + 1}`}>Older entries</Link>}</nav>}</section>
      </div>
    </section>
  </>;
}
