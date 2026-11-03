"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { getSquadPolicyVersion, isSquadPolicyApproved } from "@/lib/squad-policy";
import { joinSquad as joinSquadMember, leaveSquad as leaveSquadMember, type JoinSquadResult } from "@/lib/squad-service";
import { currentSquadWeekStart, squadCheckInSchema, squadIdSchema, squadReportSchema } from "@/lib/squad-validation";

function finish(code: string): never {
  revalidatePath("/dashboard/squads");
  redirect(`/dashboard/squads?notice=${encodeURIComponent(code)}`);
}

export async function joinSquad(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!user) finish("sign-in");
  if (!isSquadPolicyApproved()) finish("closed");
  if (user.emailVerified === null || !["FREE_MEMBER", "PAID_MEMBER"].includes(user.role)) finish("ineligible");
  if (formData.get("confirmParticipation") !== "yes") finish("consent-required");
  const parsed = squadIdSchema.safeParse(formData.get("groupId"));
  if (!parsed.success) finish("unavailable");
  const policyVersion = getSquadPolicyVersion();
  if (!policyVersion) finish("closed");
  let result: JoinSquadResult;
  try { result = await joinSquadMember(parsed.data, user.id, policyVersion); } catch { finish("try-again"); }
  finish(result.toLowerCase().replaceAll("_", "-"));
}

export async function leaveSquad(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!user) finish("sign-in");
  const parsed = squadIdSchema.safeParse(formData.get("groupId"));
  if (!parsed.success) finish("unavailable");
  let left: boolean;
  try { left = await leaveSquadMember(parsed.data, user.id); } catch { finish("try-again"); }
  finish(left ? "left" : "unavailable");
}

export async function submitSquadCheckIn(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!user) finish("sign-in");
  if (!isSquadPolicyApproved()) finish("closed");
  const parsed = squadCheckInSchema.safeParse({
    membershipId: formData.get("membershipId"),
    weekStart: formData.get("weekStart"),
    focus: formData.get("focus"),
    reflection: formData.get("reflection"),
  });
  if (!parsed.success || parsed.data.weekStart !== currentSquadWeekStart().toISOString().slice(0, 10)) finish("check-in-invalid");
  const policyVersion = getSquadPolicyVersion();
  if (!policyVersion) finish("closed");
  const db = getPrisma();
  let membership;
  try { membership = await db.squadMembership.findFirst({ where: { id: parsed.data.membershipId, userId: user.id, status: "ACTIVE", policyVersion }, select: { id: true } }); } catch { finish("try-again"); }
  if (!membership) finish("unavailable");
  const weekStart = new Date(`${parsed.data.weekStart}T00:00:00.000Z`);
  try {
    await db.squadCheckIn.upsert({
      where: { membershipId_weekStart: { membershipId: membership.id, weekStart } },
      create: { membershipId: membership.id, weekStart, focus: parsed.data.focus, reflection: parsed.data.reflection },
      update: { focus: parsed.data.focus, reflection: parsed.data.reflection },
    });
  } catch { finish("try-again"); }
  finish("check-in-saved");
}

export async function reportSquadMember(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!user) finish("sign-in");
  if (!isSquadPolicyApproved()) finish("closed");
  const policyVersion = getSquadPolicyVersion();
  if (!policyVersion) finish("closed");
  const parsed = squadReportSchema.safeParse({ membershipId: formData.get("membershipId"), category: formData.get("category"), details: formData.get("details") });
  if (!parsed.success) finish("report-invalid");
  const db = getPrisma();
  let target;
  try { target = await db.squadMembership.findFirst({ where: { id: parsed.data.membershipId, status: "ACTIVE", policyVersion }, select: { id: true, groupId: true, userId: true } }); } catch { finish("try-again"); }
  if (!target || target.userId === user.id) finish("unavailable");
  let reporter;
  try { reporter = await db.squadMembership.findFirst({ where: { groupId: target.groupId, userId: user.id, status: "ACTIVE", policyVersion }, select: { id: true } }); } catch { finish("try-again"); }
  if (!reporter) finish("unavailable");
  try {
    await db.squadReport.create({ data: { groupId: target.groupId, reporterId: user.id, membershipId: target.id, category: parsed.data.category, details: parsed.data.details } });
  } catch { finish("try-again"); }
  finish("report-sent");
}

export async function markSquadNotificationsRead(): Promise<void> {
  const user = await requireUser();
  if (!user) finish("sign-in");
  await getPrisma().squadNotification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  finish("notifications-read");
}
