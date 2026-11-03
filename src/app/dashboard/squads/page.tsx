import { Suspense } from "react";
import Link from "next/link";
import { LoadingBlock } from "@/components/site-shell";
import { getPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { getSquadPolicyText, getSquadPolicyVersion, hasAvailableSquadSeat, isSquadPolicyApproved } from "@/lib/squad-policy";
import { currentSquadWeekStart } from "@/lib/squad-validation";
import { joinSquad, leaveSquad, markSquadNotificationsRead, reportSquadMember, submitSquadCheckIn } from "@/app/dashboard/squads/actions";

const noticeText: Record<string, string> = {
  closed: "Squad participation is not open in this deployment.",
  "sign-in": "Sign in again to continue.",
  ineligible: "Squads are available to verified member accounts.",
  "consent-required": "Confirm the participation and sharing terms before joining.",
  unavailable: "That squad or membership is no longer available.",
  "try-again": "We could not complete that request. Try again.",
  active: "You joined the squad.",
  waitlisted: "The squad is full. You are on its waitlist.",
  "already-active": "You are already a member of that squad.",
  "already-waitlisted": "You are already on that squad's waitlist.",
  "policy-updated": "You accepted the updated squad guidelines.",
  removed: "A moderator removed your previous membership. Contact support if you think this is a mistake.",
  left: "You left the squad. If a place opened, the next waitlisted member was notified.",
  "check-in-invalid": "Complete both fields for the current Monday-starting week.",
  "check-in-saved": "Your weekly squad check-in was saved.",
  "report-invalid": "Add details of at least 20 characters to submit a report.",
  "report-sent": "Your report was sent to the platform moderation team.",
  "notifications-read": "Notifications marked as read.",
};

type Notice = { notice?: string };

export default function SquadsPage({ searchParams }: { searchParams: Promise<Notice> }) {
  return <Suspense fallback={<LoadingBlock label="Loading accountability squads…"/>}><SquadsContent searchParams={searchParams}/></Suspense>;
}

async function SquadsContent({ searchParams }: { searchParams: Promise<Notice> }) {
  const user = await requireUser();
  if (!user) return null;
  const params = await searchParams;
  const allowed = isSquadPolicyApproved();
  const policyText = getSquadPolicyText();
  const policyVersion = getSquadPolicyVersion();
  const weekStart = currentSquadWeekStart();
  const weekStartString = weekStart.toISOString().slice(0, 10);
  const pastFourWeeks = new Date(weekStart.getTime() - 21 * 24 * 60 * 60_000);
  const [openGroups, memberships, notifications] = await Promise.all([
    allowed ? getPrisma().accountabilityGroup.findMany({ where: { status: "OPEN" }, orderBy: { name: "asc" }, include: { memberships: { where: { userId: user.id }, select: { status: true } } } }) : Promise.resolve([]),
    allowed ? getPrisma().squadMembership.findMany({ where: { userId: user.id, status: { in: ["ACTIVE", "WAITLISTED"] } }, include: { group: true, checkIns: { where: { weekStart }, take: 1 } }, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    getPrisma().squadNotification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20, include: { group: { select: { name: true } } } }),
  ]);
  const activeGroupIds = memberships.filter((item) => item.status === "ACTIVE" && item.policyVersion === policyVersion).map((item) => item.groupId);
  const peerEntries = allowed && activeGroupIds.length ? await getPrisma().squadMembership.findMany({
    where: { groupId: { in: activeGroupIds }, status: "ACTIVE", policyVersion },
    include: { user: { select: { name: true } }, group: { select: { id: true, name: true } }, checkIns: { where: { weekStart: { gte: pastFourWeeks } }, orderBy: { weekStart: "desc" } } },
  }) : [];
  const entriesByGroup = new Map<string, typeof peerEntries>();
  for (const entry of peerEntries) entriesByGroup.set(entry.groupId, [...(entriesByGroup.get(entry.groupId) ?? []), entry]);
  const unreadNotifications = notifications.filter((item) => !item.readAt);
  const groupAvailability = (group: (typeof openGroups)[number]) => group.memberships[0]?.status ?? null;
  return <>
    <section className="page-heading member-heading"><p className="eyebrow">Accountability squads</p><h1>Support, by choice.</h1><p className="lead">Join a small group only if it feels useful. There is no chat and your private tracker is never shared here.</p></section>
    <section className="content-wrap squad-page">
      {params.notice && noticeText[params.notice] && <p className="lesson-callout" role="status">{noticeText[params.notice]}</p>}
      {!allowed ? <section className="notice"><h2>Squads are not open yet.</h2><p>Participation stays closed until the owner approves and supplies the community guidelines, moderation plan, support process, and policy version.</p></section> : <>
        {policyText && <details className="info-card squad-policy" open><summary>Community guidelines · {policyVersion}</summary>{policyText.split(/\r?\n/).filter(Boolean).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</details>}
        {unreadNotifications.length > 0 && <section className="info-card squad-notifications"><div className="squad-section-heading"><div><p className="eyebrow">In-app updates</p><h2>Notifications</h2></div><form action={markSquadNotificationsRead}><button className="button button-small button-outline-dark">Mark all read</button></form></div>{unreadNotifications.map((item) => <p key={item.id}>{item.kind === "PROMOTED" ? "A place opened and you joined" : item.kind === "WAITLISTED" ? "You joined the waitlist" : item.kind === "JOINED" ? "You joined" : item.kind === "LEFT" ? "You left" : "Your membership was updated"}{item.group?.name ? ` · ${item.group.name}` : ""} · {item.createdAt.toLocaleDateString(undefined, { dateStyle: "medium" })}</p>)}</section>}
        {memberships.filter((item) => item.status === "ACTIVE").length > 0 && <section><p className="eyebrow">Your groups</p><div className="squad-grid">{memberships.filter((item) => item.status === "ACTIVE").map((membership) => {
          const needsPolicyReview = membership.policyVersion !== policyVersion;
          const myEntry = needsPolicyReview ? undefined : membership.checkIns[0];
          const peers = entriesByGroup.get(membership.groupId) ?? [];
          return <article className="info-card squad-card" key={membership.id}><div className="squad-section-heading"><div><p className="eyebrow">Active member · {membership.group.currentMemberCount}/{membership.group.capacity}</p><h2>{membership.group.name}</h2></div><form action={leaveSquad}><input type="hidden" name="groupId" value={membership.groupId}/><button className="button button-small button-outline-dark">Leave squad</button></form></div><p>{membership.group.description}</p><div className="squad-sharing-note"><strong>What members share:</strong> Your weekly focus and reflection are visible to the active members of this group. They are separate from your private tracker. Platform moderators can review a report if one is submitted.</div>
            {needsPolicyReview ? <div className="notice"><strong>Guidelines updated.</strong><p>Review the current guidelines above and accept the new version before reading or sharing group check-ins.</p><form className="squad-join-form" action={joinSquad}><input type="hidden" name="groupId" value={membership.groupId}/><label className="checkbox-field"><input type="checkbox" name="confirmParticipation" value="yes" required/><span>I have reviewed and agree to the current community guidelines and sharing terms.</span></label><button className="button button-dark">Accept updated guidelines</button></form></div> : <>
              <form className="squad-checkin-form" action={submitSquadCheckIn}><p className="eyebrow">This week · starting Monday {weekStart.toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" })}</p><input type="hidden" name="membershipId" value={membership.id}/><input type="hidden" name="weekStart" value={weekStartString}/><label>One focus for this week<textarea name="focus" minLength={3} maxLength={400} rows={2} defaultValue={myEntry?.focus ?? ""} required/></label><label>One reflection from last week<textarea name="reflection" minLength={3} maxLength={400} rows={2} defaultValue={myEntry?.reflection ?? ""} required/></label><button className="button button-dark">{myEntry ? "Update weekly check-in" : "Share check-in with this squad"}</button></form>
            <div className="squad-shared-checkins"><h3>Recent group check-ins</h3>{peers.flatMap((peer) => peer.checkIns.map((entry) => ({ ...entry, memberName: peer.user.name || "Member" }))).length === 0 ? <p>No check-ins have been shared in the last four weeks.</p> : peers.flatMap((peer) => peer.checkIns.map((entry) => ({ ...entry, memberName: peer.user.name || "Member" }))).map((entry) => <article className="squad-shared-entry" key={entry.id}><p><strong>{entry.memberName}</strong> · week of {entry.weekStart.toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" })}</p><p><strong>Focus:</strong> {entry.focus}</p><p><strong>Reflection:</strong> {entry.reflection}</p></article>)}</div>
            <details className="squad-report-details"><summary>Report a safety or conduct concern</summary><p>Reports are private to the platform moderation team. Include only details needed to help us review.</p><form className="squad-checkin-form" action={reportSquadMember}><label>Member<select name="membershipId" required defaultValue=""><option value="" disabled>Choose a group member</option>{peers.filter((peer) => peer.userId !== user.id).map((peer) => <option key={peer.id} value={peer.id}>{peer.user.name || "Member"}</option>)}</select></label><label>Category<select name="category" defaultValue="CONDUCT"><option value="SAFETY">Safety</option><option value="CONDUCT">Conduct</option><option value="OTHER">Other</option></select></label><label>What should moderators know?<textarea name="details" minLength={20} maxLength={1000} rows={3} required/></label><button className="button button-outline-dark">Send private report</button></form></details>
            </>}
          </article>;
        })}</div></section>}
        {memberships.filter((item) => item.status === "WAITLISTED").length > 0 && <section><p className="eyebrow">Waitlist</p><div className="squad-grid">{memberships.filter((item) => item.status === "WAITLISTED").map((membership) => <article className="info-card squad-card" key={membership.id}><div className="squad-section-heading"><div><p className="eyebrow">Waitlisted</p><h2>{membership.group.name}</h2></div><form action={leaveSquad}><input type="hidden" name="groupId" value={membership.groupId}/><button className="button button-small button-outline-dark">Leave waitlist</button></form></div><p>{membership.group.description}</p>{membership.policyVersion !== policyVersion && <div className="notice"><p>Guidelines have been updated. Re-accept the current version to remain on the waitlist.</p><form className="squad-join-form" action={joinSquad}><input type="hidden" name="groupId" value={membership.groupId}/><label className="checkbox-field"><input type="checkbox" name="confirmParticipation" value="yes" required/><span>I have reviewed and agree to the current community guidelines.</span></label><button className="button button-dark">Accept updated guidelines</button></form></div>}</article>)}</div></section>}
        <section><p className="eyebrow">Open groups</p><div className="squad-grid">{openGroups.length === 0 ? <p className="empty-state">There are no open squads right now. Check back when a new group is available.</p> : openGroups.map((group) => {
          const membershipStatus = groupAvailability(group);
          return <article className="info-card squad-card" key={group.id}><p className="eyebrow">{group.currentMemberCount}/{group.capacity} members</p><h2>{group.name}</h2><p>{group.description}</p>{membershipStatus === "ACTIVE" ? <span className="status-badge">Already a member</span> : membershipStatus === "WAITLISTED" ? <span className="status-badge">Already waitlisted</span> : membershipStatus === "REMOVED" ? <span className="status-badge">Membership closed by moderator</span> : <form className="squad-join-form" action={joinSquad}><input type="hidden" name="groupId" value={group.id}/><label className="checkbox-field"><input type="checkbox" name="confirmParticipation" value="yes" required/><span>I agree to this squad’s approved community guidelines. I understand my weekly focus and reflection will be shared with active group members.</span></label><button className="button button-dark">{hasAvailableSquadSeat(group.currentMemberCount, group.capacity, true) ? "Join squad" : "Join waitlist"}</button></form>}</article>;
        })}</div></section>
      </>}
      <p className="squad-footer"><Link className="text-link" href="/dashboard">Return to dashboard →</Link></p>
    </section>
  </>;
}
