"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security";
import { isSquadPolicyApproved } from "@/lib/squad-policy";
import { promoteWaitingMembers, removeSquadMember as removeMember, withSerializableRetry } from "@/lib/squad-service";
import { squadReportReviewSchema, squadSchema, squadIdSchema } from "@/lib/squad-validation";

function done(code: string): never {
  revalidatePath("/admin/squads");
  revalidatePath("/dashboard/squads");
  redirect(`/admin/squads?notice=${encodeURIComponent(code)}`);
}

export async function saveSquad(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  if (!admin) done("forbidden");
  const parsed = squadSchema.safeParse({ id: formData.get("id") || undefined, name: formData.get("name"), description: formData.get("description"), capacity: formData.get("capacity"), status: formData.get("status") });
  if (!parsed.success) done("invalid");
  if (parsed.data.status === "OPEN" && !isSquadPolicyApproved()) done("policy-required");
  try {
    await withSerializableRetry(async (tx) => {
      let groupId: string;
      if (parsed.data.id) {
        const existing = await tx.accountabilityGroup.findUnique({ where: { id: parsed.data.id }, select: { id: true, currentMemberCount: true } });
        if (!existing) throw new Error("group_not_found");
        if (parsed.data.capacity < existing.currentMemberCount) throw new Error("capacity_below_active_members");
        const saved = await tx.accountabilityGroup.update({ where: { id: existing.id }, data: { name: parsed.data.name, description: parsed.data.description, capacity: parsed.data.capacity, status: parsed.data.status }, select: { id: true } });
        groupId = saved.id;
      } else {
        const saved = await tx.accountabilityGroup.create({ data: { name: parsed.data.name, description: parsed.data.description, capacity: parsed.data.capacity, status: parsed.data.status }, select: { id: true } });
        groupId = saved.id;
      }
      if (parsed.data.status === "OPEN") await promoteWaitingMembers(tx, groupId);
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: parsed.data.id ? "SQUAD_UPDATE" : "SQUAD_CREATE", entityType: "AccountabilityGroup", entityId: groupId, summary: `Saved squad status ${parsed.data.status} with capacity ${parsed.data.capacity}.` } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "capacity_below_active_members") done("capacity-below-members");
    done("save-failed");
  }
  done("saved");
}

export async function reviewSquadReport(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  if (!admin) done("forbidden");
  const parsed = squadReportReviewSchema.safeParse({ reportId: formData.get("reportId"), status: formData.get("status") });
  if (!parsed.success) done("invalid");
  try {
    await getPrisma().$transaction(async (tx) => {
      const report = await tx.squadReport.findUnique({ where: { id: parsed.data.reportId }, select: { id: true, status: true } });
      if (!report || report.status === "CLOSED") throw new Error("report_not_open");
      await tx.squadReport.update({ where: { id: report.id }, data: { status: parsed.data.status, reviewedAt: new Date() } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "SQUAD_REPORT_REVIEW", entityType: "SquadReport", entityId: report.id, summary: `Updated squad report status to ${parsed.data.status}.` } });
    });
  } catch {
    done("review-failed");
  }
  done("reviewed");
}

export async function removeSquadMember(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  if (!admin) done("forbidden");
  const parsed = squadIdSchema.safeParse(formData.get("membershipId"));
  if (!parsed.success) done("invalid");
  let removed: boolean;
  try { removed = await removeMember(parsed.data); } catch { done("remove-failed"); }
  if (!removed) done("member-unavailable");
  try {
    await getPrisma().adminAuditLog.create({ data: { actorId: admin.id, action: "SQUAD_MEMBER_REMOVE", entityType: "SquadMembership", entityId: parsed.data, summary: "Removed a member from an accountability squad." } });
  } catch { done("remove-failed"); }
  done("member-removed");
}
