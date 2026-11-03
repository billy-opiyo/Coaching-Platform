"use server";

import { z } from "zod";
import { verifyUnsubscribeToken } from "@/lib/email-tokens";
import { getPrisma } from "@/lib/prisma";

export type UnsubscribeState = { success: boolean; message: string };
const tokenSchema = z.string().min(40).max(200);

export async function unsubscribeFromMarketing(_previous: UnsubscribeState, formData: FormData): Promise<UnsubscribeState> {
  const parsed = tokenSchema.safeParse(formData.get("token"));
  if (!parsed.success) return { success: false, message: "Open the unsubscribe link from an email." };
  const consentEventId = verifyUnsubscribeToken(parsed.data);
  if (!consentEventId) return { success: false, message: "This unsubscribe link is invalid." };
  try {
    const db = getPrisma();
    const event = await db.marketingConsentEvent.findUnique({ where: { id: consentEventId }, select: { id: true, leadId: true } });
    if (event) {
      await db.$transaction(async (tx) => {
        const latest = await tx.marketingConsentEvent.findFirst({ where: { leadId: event.leadId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
        if (latest?.action === "OPT_IN") {
          await tx.marketingConsentEvent.create({ data: { leadId: event.leadId, action: "OPT_OUT", consentVersion: latest.consentVersion } });
          await tx.emailSequenceEnrollment.updateMany({ where: { leadId: event.leadId, status: { in: ["ACTIVE", "PAUSED"] } }, data: { status: "CANCELLED", cancelledAt: new Date() } });
          await tx.emailJob.updateMany({ where: { enrollment: { leadId: event.leadId }, status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "CANCELLED", lockedAt: null } });
        }
      });
    }
    return { success: true, message: "You have been unsubscribed from optional educational emails. Guide delivery and account messages are separate." };
  } catch {
    return { success: false, message: "We could not update your email preference. Please try again." };
  }
}
