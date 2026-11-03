import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoadingBlock } from "@/components/site-shell";
import { getPrisma } from "@/lib/prisma";
import { isSquadPolicyApproved } from "@/lib/squad-policy";
import { requirePlatformAdmin } from "@/lib/security";
import { removeSquadMember, reviewSquadReport, saveSquad } from "@/app/admin/squads/actions";

export const metadata = { title: "Accountability squads", robots: { index: false, follow: false } };

export default function AdminSquadsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  return <main className="page-main"><header className="admin-header"><Link className="wordmark" href="/admin"><span className="wordmark-mark" aria-hidden="true">C</span>Administration</Link><nav aria-label="Administration"><Link href="/admin/content">Learning content</Link><Link href="/admin/resources">External tools</Link><Link href="/admin/email">Email</Link><Link href="/admin/squads" aria-current="page">Squads</Link></nav></header><Suspense fallback={<LoadingBlock label="Loading squad operations…"/>}><AdminSquads searchParams={searchParams}/></Suspense></main>;
}

async function AdminSquads({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const admin = await requirePlatformAdmin();
  if (!admin) redirect("/admin");
  const params = await searchParams;
  const [groups, reports, activeMemberships, openReports] = await Promise.all([
    getPrisma().accountabilityGroup.findMany({ orderBy: { createdAt: "desc" }, include: { memberships: { where: { status: { in: ["ACTIVE", "WAITLISTED"] } }, orderBy: [{ status: "asc" }, { joinedAt: "asc" }], include: { user: { select: { name: true } } } } } }),
    getPrisma().squadReport.findMany({ where: { status: { in: ["OPEN", "REVIEWED"] } }, orderBy: { createdAt: "asc" }, include: { group: { select: { name: true } }, reporter: { select: { name: true } }, membership: { include: { user: { select: { name: true } } } } } }),
    getPrisma().squadMembership.count({ where: { status: "ACTIVE" } }),
    getPrisma().squadReport.count({ where: { status: "OPEN" } }),
  ]);
  const notices: Record<string, string> = { saved: "Squad saved.", invalid: "Review the squad or report fields and try again.", "policy-required": "Approve the community policy and enable the gate before opening a squad.", "capacity-below-members": "Capacity cannot be lower than the current number of active members.", "save-failed": "The squad could not be saved.", reviewed: "Report status updated.", "review-failed": "The report could not be updated.", "member-unavailable": "That membership is no longer active or waitlisted.", "remove-failed": "The member could not be removed.", "member-removed": "Member removed; a waitlisted member may have been promoted.", forbidden: "Platform administrator access is required." };
  return <section className="content-wrap"><p className="eyebrow">Platform administration</p><h1 className="admin-title">Accountability squads</h1><p className="admin-lead">Manage opt-in groups, capacity, waitlists, and member reports. Reports and group administration are visible only to platform administrators.</p>
    {!isSquadPolicyApproved() && <div className="notice"><strong>Squads are closed.</strong> Community guidelines and support/moderation procedures must be approved before members can join.</div>}
    {params.notice && notices[params.notice] && <p className="lesson-callout" role="status">{notices[params.notice]}</p>}
    <div className="admin-metrics"><article><span>Squads</span><strong>{groups.length}</strong></article><article><span>Active memberships</span><strong>{activeMemberships}</strong></article><article><span>Open reports</span><strong>{openReports}</strong></article></div>
    <section className="admin-record"><p className="eyebrow">Create a squad</p><form className="admin-edit-form squad-admin-form" action={saveSquad}><label>Display name<input name="name" minLength={3} maxLength={100} required/></label><label>Capacity<input name="capacity" type="number" min={2} max={100} defaultValue={8} required/></label><label className="form-span">Description<textarea name="description" minLength={30} maxLength={1000} rows={3} required/></label><label>Status<select name="status" defaultValue="DRAFT"><option value="DRAFT">Draft</option><option value="CLOSED">Closed</option><option value="OPEN">Open for opt-in</option></select></label><button className="button button-dark">Create squad</button></form></section>
    <div className="admin-records">{groups.map((group) => <section className="admin-record" key={group.id}><div className="admin-record-heading"><div><p className="eyebrow">{group.currentMemberCount}/{group.capacity} active · {group.status.toLowerCase()}</p><h2>{group.name}</h2><p>{group.description}</p></div></div><form className="admin-edit-form squad-admin-form" action={saveSquad}><input type="hidden" name="id" value={group.id}/><label>Display name<input name="name" minLength={3} maxLength={100} defaultValue={group.name} required/></label><label>Capacity<input name="capacity" type="number" min={2} max={100} defaultValue={group.capacity} required/></label><label className="form-span">Description<textarea name="description" minLength={30} maxLength={1000} rows={3} defaultValue={group.description} required/></label><label>Status<select name="status" defaultValue={group.status}><option value="DRAFT">Draft</option><option value="CLOSED">Closed</option><option value="OPEN">Open for opt-in</option></select></label><button className="button button-dark">Save squad</button></form>
      {group.memberships.length > 0 && <div className="squad-member-admin"><h3>Current members and waitlist</h3>{group.memberships.map((membership) => <div className="squad-admin-member" key={membership.id}><span>{membership.user.name || "Member"} · {membership.status === "ACTIVE" ? "Active" : "Waitlisted"}</span><form action={removeSquadMember}><input type="hidden" name="membershipId" value={membership.id}/><button className="button button-small button-outline-dark">Remove</button></form></div>)}</div>}
    </section>)}</div>
    <section className="info-card squad-report-admin"><p className="eyebrow">Member safety</p><h2>Reports awaiting review</h2>{reports.length === 0 ? <p>No open reports.</p> : reports.map((report) => <article className="squad-report" key={report.id}><p className="eyebrow">{report.group.name} · {report.category.toLowerCase()} · {report.status.toLowerCase()}</p><p><strong>Reported member:</strong> {report.membership.user.name || "Member"}. <strong>Submitted by:</strong> {report.reporter.name || "Member"}.</p><p className="squad-report-details">{report.details}</p><form action={reviewSquadReport}><input type="hidden" name="reportId" value={report.id}/><label>Review status<select name="status" defaultValue="REVIEWED"><option value="REVIEWED">Reviewed, keep open</option><option value="CLOSED">Close report</option></select></label><button className="button button-dark">Save review</button></form></article>)}</section>
  </section>;
}
