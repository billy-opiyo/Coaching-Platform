"use server";

import { createBlueprintAccessToken, hashEmailToken } from "@/lib/email-tokens";
import { BLUEPRINT_SEQUENCE_KEY, isBlueprintCaptureAvailable } from "@/lib/blueprint-config";
import { blueprintRequestSchema } from "@/lib/lead-validation";
import { getPrisma } from "@/lib/prisma";
import { enforceBlueprintRateLimit } from "@/lib/security";

export type BlueprintFormState = { success: boolean; message: string };
const genericSuccess: BlueprintFormState = { success: true, message: "If the guide request is accepted, a delivery email will arrive shortly." };

export async function requestBlueprint(_previous: BlueprintFormState, formData: FormData): Promise<BlueprintFormState> {
  if (!(await isBlueprintCaptureAvailable())) return { success: false, message: "Guide requests are not available yet. No email address was stored." };
  const parsed = blueprintRequestSchema.safeParse({ email: formData.get("email"), marketingConsent: formData.get("marketingConsent") === "yes" ? "yes" : "no" });
  if (!parsed.success) return { success: false, message: "Enter a valid email address." };

  const consentVersion = process.env.BLUEPRINT_CONSENT_VERSION;
  try {
    if (parsed.data.marketingConsent === "yes") {
      const stepCount = await getPrisma().emailSequenceStep.count({ where: { sequenceKey: BLUEPRINT_SEQUENCE_KEY, isEnabled: true } });
      if (stepCount !== 4) return { success: false, message: "Optional email updates are not available yet. You can request the guide without selecting them." };
    }
    if (!(await enforceBlueprintRateLimit(parsed.data.email))) return genericSuccess;
    const db = getPrisma();
    const guideVersion = "v1";
    await db.$transaction(async (tx) => {
      const now = new Date();
      const lead = await tx.lead.upsert({
        where: { email: parsed.data.email },
        create: { email: parsed.data.email, firstRequestedAt: now, lastRequestedAt: now },
        update: { lastRequestedAt: now },
        select: { id: true },
      });
      const existingDelivery = await tx.blueprintDelivery.findUnique({ where: { leadId_guideVersion: { leadId: lead.id, guideVersion } }, select: { id: true } });
      if (!existingDelivery) {
        const tokenExpiresAt = new Date(now.getTime() + 48 * 60 * 60_000);
        const accessToken = createBlueprintAccessToken(lead.id, guideVersion, tokenExpiresAt);
        await tx.blueprintDelivery.create({ data: { leadId: lead.id, guideVersion, tokenHash: hashEmailToken(accessToken), tokenExpiresAt } });
      }

      if (parsed.data.marketingConsent === "yes" && consentVersion) {
        const latest = await tx.marketingConsentEvent.findFirst({ where: { leadId: lead.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
        if (latest?.action !== "OPT_IN" || latest.consentVersion !== consentVersion) {
          const event = await tx.marketingConsentEvent.create({ data: { leadId: lead.id, action: "OPT_IN", consentVersion } });
          const steps = await tx.emailSequenceStep.findMany({ where: { sequenceKey: BLUEPRINT_SEQUENCE_KEY, isEnabled: true }, orderBy: { stepNumber: "asc" } });
          const jobs = steps.map((step) => {
            const scheduledAt = new Date(event.createdAt.getTime() + step.delayDays * 24 * 60 * 60_000);
            const idempotencyKey = `enrollment-${event.id}-step-${step.stepNumber}`;
            return {
              stepId: step.id,
              idempotencyKey,
              scheduledAt,
              nextAttemptAt: scheduledAt,
            };
          });
          await tx.emailSequenceEnrollment.create({
            data: {
              leadId: lead.id,
              consentEventId: event.id,
              sequenceKey: BLUEPRINT_SEQUENCE_KEY,
              consentVersion,
              jobs: { create: jobs },
            },
          });
        }
      }
    });
    return genericSuccess;
  } catch {
    return genericSuccess;
  }
}
