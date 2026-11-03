"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { emailStepSchema } from "@/lib/lead-validation";
import { isEmailTemplateReady, scheduleEmailStep } from "@/lib/email-policy";

export type EmailActionState = { success: boolean; message: string };

export async function setEmailAutomationPaused(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Administrator access is required.");
  const paused = formData.get("paused") === "true";
  await getPrisma().emailAutomationControl.upsert({ where: { id: "default" }, create: { id: "default", paused }, update: { paused } });
  await getPrisma().adminAuditLog.create({ data: { actorId: admin.id, action: paused ? "EMAIL_AUTOMATION_PAUSE" : "EMAIL_AUTOMATION_RESUME", entityType: "EmailAutomationControl", entityId: "default", summary: paused ? "Paused optional email automation." : "Resumed optional email automation." } });
  revalidatePath("/admin/email");
}

export async function updateEmailStep(_previous: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, message: "Administrator access is required." };
  const parsed = emailStepSchema.safeParse({ id: formData.get("id"), subject: formData.get("subject"), bodyText: formData.get("bodyText"), delayDays: formData.get("delayDays"), isEnabled: formData.get("isEnabled") ? "true" : "false" });
  if (!parsed.success) return { success: false, message: "Add a subject, 30–10,000 characters of email text, and a delay from 0 to 30 days." };
  const data = parsed.data;
  if (data.isEnabled === "true" && !isEmailTemplateReady(data.subject, data.bodyText)) return { success: false, message: "Replace the draft placeholder with owner-approved content before enabling this step." };
  const db = getPrisma();
  const existing = await db.emailSequenceStep.findUnique({ where: { id: data.id }, select: { id: true, sequenceKey: true, stepNumber: true, isEnabled: true } });
  if (!existing) return { success: false, message: "That email step is no longer available." };
  const enabled = data.isEnabled === "true";
  await db.$transaction(async (tx) => {
    await tx.emailSequenceStep.update({ where: { id: existing.id }, data: { subject: data.subject, bodyText: data.bodyText, delayDays: data.delayDays, isEnabled: enabled } });
    if (!enabled) await tx.emailJob.updateMany({ where: { stepId: existing.id, status: "PENDING" }, data: { status: "CANCELLED" } });
    if (enabled && !existing.isEnabled) {
      const enrollments = await tx.emailSequenceEnrollment.findMany({ where: { sequenceKey: existing.sequenceKey, status: "ACTIVE" }, include: { consentEvent: true } });
      for (const enrollment of enrollments) {
        const latest = await tx.marketingConsentEvent.findFirst({ where: { leadId: enrollment.leadId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, action: true } });
        if (latest?.id !== enrollment.consentEventId || latest.action !== "OPT_IN") continue;
        const scheduledAt = scheduleEmailStep(enrollment.startedAt, data.delayDays);
        const queued = await tx.emailJob.findUnique({ where: { enrollmentId_stepId: { enrollmentId: enrollment.id, stepId: existing.id } }, select: { id: true, status: true } });
        if (!queued) {
          await tx.emailJob.create({ data: { enrollmentId: enrollment.id, stepId: existing.id, idempotencyKey: `enrollment-${enrollment.consentEventId}-step-${existing.stepNumber}`, scheduledAt, nextAttemptAt: scheduledAt } });
        } else if (queued.status === "CANCELLED") {
          await tx.emailJob.update({ where: { id: queued.id }, data: { status: "PENDING", scheduledAt, nextAttemptAt: scheduledAt, lockedAt: null, lastError: null } });
        }
      }
    }
    await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "EMAIL_STEP_UPDATE", entityType: "EmailSequenceStep", entityId: existing.id, summary: `Updated onboarding email step ${existing.stepNumber}; enabled=${enabled}.` } });
  });
  revalidatePath("/admin/email");
  return { success: true, message: "Email sequence step saved." };
}
