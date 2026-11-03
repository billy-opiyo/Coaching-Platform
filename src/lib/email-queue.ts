import "server-only";
import { createBlueprintAccessToken, createUnsubscribeToken } from "@/lib/email-tokens";
import { BLUEPRINT_SEQUENCE_KEY, getBlueprintRetentionDays, isBlueprintCaptureAvailable } from "@/lib/blueprint-config";
import { baseUrl, sendTextEmail } from "@/lib/email";
import { canRetryEmail, consentAllowsSend } from "@/lib/email-policy";
import { getPrisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 10 * 60_000;
const MAX_BATCH = 20;

function retryAt(attempt: number): Date {
  return new Date(Date.now() + Math.min(60, 2 ** attempt) * 60_000);
}

async function processBlueprintDeliveries(now: Date): Promise<{ sent: number; failed: number }> {
  if (!(await isBlueprintCaptureAvailable())) return { sent: 0, failed: 0 };
  const db = getPrisma();
  const stale = new Date(now.getTime() - LOCK_MS);
  const due = await db.blueprintDelivery.findMany({
    where: { OR: [{ status: "PENDING", nextAttemptAt: { lte: now } }, { status: "PROCESSING", lockedAt: { lt: stale } }] },
    orderBy: { nextAttemptAt: "asc" }, take: MAX_BATCH, select: { id: true, leadId: true, guideVersion: true, tokenExpiresAt: true, attempts: true, status: true, lockedAt: true },
  });
  let sent = 0; let failed = 0;
  for (const candidate of due) {
    const claim = await db.blueprintDelivery.updateMany({ where: { id: candidate.id, OR: [{ status: "PENDING", nextAttemptAt: { lte: now } }, { status: "PROCESSING", lockedAt: { lt: stale } }] }, data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } } });
    if (claim.count !== 1) continue;
    const delivery = await db.blueprintDelivery.findUnique({ where: { id: candidate.id }, include: { lead: { select: { email: true } } } });
    if (!delivery || delivery.status !== "PROCESSING") continue;
    try {
      if (delivery.tokenExpiresAt <= now) throw new Error("delivery_expired");
      const token = createBlueprintAccessToken(delivery.leadId, delivery.guideVersion, delivery.tokenExpiresAt);
      if (process.env.NODE_ENV === "production" && new URL(process.env.APP_URL ?? "").protocol !== "https:") throw new Error("invalid_public_url");
      const link = new URL("/blueprint/access", baseUrl());
      link.hash = `token=${encodeURIComponent(token)}`;
      const messageId = await sendTextEmail(delivery.lead.email, "Your 7-Day Blueprint", `Here is the guide you requested. Use this private link within 48 hours to download it:\n\n${link}\n\nYou requested the guide; this message does not enroll you in ongoing marketing email.`, `blueprint-delivery-${delivery.id}`);
      await db.blueprintDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: new Date(), providerMessageId: messageId, lockedAt: null, lastError: null } });
      sent += 1;
    } catch {
      const attempts = delivery.attempts;
      const canRetry = canRetryEmail(attempts, delivery.createdAt, now, MAX_ATTEMPTS) && delivery.tokenExpiresAt > now;
      await db.blueprintDelivery.update({ where: { id: delivery.id }, data: { status: canRetry ? "PENDING" : "FAILED", nextAttemptAt: canRetry ? retryAt(attempts) : delivery.nextAttemptAt, lockedAt: null, lastError: "Email delivery failed; see provider logs." } });
      failed += 1;
    }
  }
  return { sent, failed };
}

function fillEmailText(body: string, consentEventId: string): string {
  const root = baseUrl();
  const unsubscribe = new URL("/unsubscribe", root);
  unsubscribe.hash = `token=${encodeURIComponent(createUnsubscribeToken(consentEventId))}`;
  return body.replaceAll("{{resourcesUrl}}", new URL("/resources", root).toString()).replaceAll("{{coachingUrl}}", new URL("/coaching", root).toString()).replaceAll("{{unsubscribeUrl}}", unsubscribe.toString());
}

async function processSequenceJobs(now: Date): Promise<{ sent: number; failed: number }> {
  const db = getPrisma();
  const control = await db.emailAutomationControl.findUnique({ where: { id: "default" }, select: { paused: true } });
  if (!control || control.paused) return { sent: 0, failed: 0 };
  const stale = new Date(now.getTime() - LOCK_MS);
  const due = await db.emailJob.findMany({
    where: { enrollment: { status: "ACTIVE", sequenceKey: BLUEPRINT_SEQUENCE_KEY, lead: { blueprintDeliveries: { some: { status: "SENT" } } } }, step: { isEnabled: true }, OR: [{ status: "PENDING", scheduledAt: { lte: now }, nextAttemptAt: { lte: now } }, { status: "PROCESSING", lockedAt: { lt: stale } }] },
    orderBy: { scheduledAt: "asc" }, take: MAX_BATCH,
    select: { id: true, enrollmentId: true, stepId: true },
  });
  let sent = 0; let failed = 0;
  for (const candidate of due) {
    const claim = await db.emailJob.updateMany({ where: { id: candidate.id, OR: [{ status: "PENDING", scheduledAt: { lte: now }, nextAttemptAt: { lte: now } }, { status: "PROCESSING", lockedAt: { lt: stale } }] }, data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } } });
    if (claim.count !== 1) continue;
    const job = await db.emailJob.findUnique({ where: { id: candidate.id }, include: { step: true, enrollment: { include: { lead: { select: { email: true } }, consentEvent: true } } } });
    if (!job || job.status !== "PROCESSING") continue;
    const latestConsent = await db.marketingConsentEvent.findFirst({ where: { leadId: job.enrollment.leadId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    if (!consentAllowsSend(latestConsent, { consentEventId: job.enrollment.consentEventId, consentVersion: job.enrollment.consentVersion })) {
      await db.emailJob.update({ where: { id: job.id }, data: { status: "CANCELLED", lockedAt: null, lastError: null } });
      await db.emailSequenceEnrollment.update({ where: { id: job.enrollmentId }, data: { status: "CANCELLED", cancelledAt: now } });
      continue;
    }
    const lastSent = await db.emailJob.findFirst({ where: { enrollmentId: job.enrollmentId, status: "SENT", sentAt: { gte: new Date(now.getTime() - 20 * 60 * 60_000) }, id: { not: job.id } }, orderBy: { sentAt: "desc" }, select: { sentAt: true } });
    if (lastSent?.sentAt) {
      await db.emailJob.update({ where: { id: job.id }, data: { status: "PENDING", nextAttemptAt: new Date(lastSent.sentAt.getTime() + 24 * 60 * 60_000), lockedAt: null } });
      continue;
    }
    try {
      const text = `${fillEmailText(job.step.bodyText, job.enrollment.consentEventId)}\n\nUnsubscribe from optional updates: ${new URL("/unsubscribe", baseUrl())}#token=${encodeURIComponent(createUnsubscribeToken(job.enrollment.consentEventId))}`;
      const messageId = await sendTextEmail(job.enrollment.lead.email, job.step.subject, text, job.idempotencyKey);
      await db.emailJob.update({ where: { id: job.id }, data: { status: "SENT", sentAt: new Date(), providerMessageId: messageId, lockedAt: null, lastError: null } });
      const remaining = await db.emailJob.count({ where: { enrollmentId: job.enrollmentId, status: { in: ["PENDING", "PROCESSING"] }, id: { not: job.id } } });
      if (remaining === 0) await db.emailSequenceEnrollment.update({ where: { id: job.enrollmentId }, data: { status: "COMPLETED", completedAt: new Date() } });
      sent += 1;
    } catch {
      const attempts = job.attempts;
      const canRetry = canRetryEmail(attempts, job.createdAt, new Date(), MAX_ATTEMPTS);
      await db.emailJob.update({ where: { id: job.id }, data: { status: canRetry ? "PENDING" : "FAILED", nextAttemptAt: canRetry ? retryAt(attempts) : job.nextAttemptAt, lockedAt: null, lastError: "Email delivery failed; see provider logs." } });
      failed += 1;
    }
  }
  return { sent, failed };
}

async function cleanupExpiredLeads(now: Date): Promise<number> {
  const retentionDays = getBlueprintRetentionDays();
  if (retentionDays === null) return 0;
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60_000);
  const db = getPrisma();
  const expired = await db.lead.findMany({
    where: { lastRequestedAt: { lt: cutoff }, sequenceEnrollments: { none: { status: { in: ["ACTIVE", "PAUSED"] } } }, blueprintDeliveries: { none: { OR: [{ status: { in: ["PENDING", "PROCESSING"] } }, { tokenExpiresAt: { gt: now } }] } } },
    orderBy: { lastRequestedAt: "asc" }, take: 500, select: { id: true },
  });
  if (expired.length) await db.lead.deleteMany({ where: { id: { in: expired.map((lead) => lead.id) } } });
  await db.emailProviderEvent.deleteMany({ where: { occurredAt: { lt: cutoff } } });
  return expired.length;
}

export async function processEmailQueue() {
  const now = new Date();
  const [blueprint, sequence] = await Promise.all([processBlueprintDeliveries(now), processSequenceJobs(now)]);
  const expiredLeadRecords = await cleanupExpiredLeads(now);
  return { blueprintSent: blueprint.sent, blueprintFailed: blueprint.failed, sequenceSent: sequence.sent, sequenceFailed: sequence.failed, expiredLeadRecords };
}
