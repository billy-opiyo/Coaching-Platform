import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getSquadPolicyVersion } from "@/lib/squad-policy";

async function promoteWaitingMembers(tx: Prisma.TransactionClient, groupId: string): Promise<void> {
  const policyVersion = getSquadPolicyVersion();
  if (!policyVersion) return;
  for (;;) {
    const group = await tx.accountabilityGroup.findUnique({ where: { id: groupId }, select: { status: true, capacity: true, currentMemberCount: true } });
    if (!group || group.status !== "OPEN" || group.currentMemberCount >= group.capacity) return;
    const seat = await tx.accountabilityGroup.updateMany({
      where: { id: groupId, status: "OPEN", currentMemberCount: { lt: group.capacity } },
      data: { currentMemberCount: { increment: 1 } },
    });
    if (seat.count !== 1) return;
    const waiting = await tx.squadMembership.findFirst({
      where: { groupId, status: "WAITLISTED", policyVersion },
      orderBy: [{ waitlistedAt: "asc" }, { createdAt: "asc" }],
      select: { id: true, userId: true },
    });
    if (!waiting) {
      await tx.accountabilityGroup.updateMany({ where: { id: groupId, currentMemberCount: { gt: 0 } }, data: { currentMemberCount: { decrement: 1 } } });
      return;
    }
    const promoted = await tx.squadMembership.updateMany({
      where: { id: waiting.id, status: "WAITLISTED" },
      data: { status: "ACTIVE", joinedAt: new Date(), waitlistedAt: null, leftAt: null },
    });
    if (promoted.count === 1) {
      await tx.squadNotification.create({ data: { userId: waiting.userId, groupId, kind: "PROMOTED" } });
    } else {
      await tx.accountabilityGroup.updateMany({ where: { id: groupId, currentMemberCount: { gt: 0 } }, data: { currentMemberCount: { decrement: 1 } } });
    }
  }
}

async function withSerializableRetry<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  const db = getPrisma();
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await db.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      if (attempt < 2 && typeof error === "object" && error !== null && "code" in error && error.code === "P2034") continue;
      throw error;
    }
  }
}

export type JoinSquadResult = "ACTIVE" | "WAITLISTED" | "ALREADY_ACTIVE" | "ALREADY_WAITLISTED" | "POLICY_UPDATED" | "REMOVED" | "CLOSED";

export async function joinSquad(groupId: string, userId: string, policyVersion: string): Promise<JoinSquadResult> {
  return withSerializableRetry(async (tx) => {
    const group = await tx.accountabilityGroup.findUnique({ where: { id: groupId }, select: { id: true, status: true, capacity: true, currentMemberCount: true } });
    if (!group) return "CLOSED";
    const existing = await tx.squadMembership.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true, status: true, policyVersion: true } });
    if (existing?.status === "ACTIVE" || existing?.status === "WAITLISTED") {
      if (existing.policyVersion === policyVersion) return existing.status === "ACTIVE" ? "ALREADY_ACTIVE" : "ALREADY_WAITLISTED";
      const agreedAt = new Date();
      await tx.squadMembership.update({ where: { id: existing.id }, data: { policyVersion, agreedAt } });
      await tx.squadConsentEvent.create({ data: { membershipId: existing.id, action: "OPT_IN", policyVersion, createdAt: agreedAt } });
      return "POLICY_UPDATED";
    }
    if (existing?.status === "REMOVED") return "REMOVED";
    if (group.status !== "OPEN") return "CLOSED";

    const seat = await tx.accountabilityGroup.updateMany({
      where: { id: groupId, status: "OPEN", currentMemberCount: { lt: group.capacity } },
      data: { currentMemberCount: { increment: 1 } },
    });
    const currentGroup = await tx.accountabilityGroup.findUnique({ where: { id: groupId }, select: { status: true } });
    if (!currentGroup || currentGroup.status !== "OPEN") return "CLOSED";
    const now = new Date();
    const status = seat.count === 1 ? "ACTIVE" : "WAITLISTED";
    let membershipId: string;
    if (existing) {
      const updated = await tx.squadMembership.update({
        where: { id: existing.id },
        data: { status, policyVersion, agreedAt: now, joinedAt: status === "ACTIVE" ? now : null, waitlistedAt: status === "WAITLISTED" ? now : null, leftAt: null },
        select: { id: true },
      });
      membershipId = updated.id;
    } else {
      const created = await tx.squadMembership.create({
        data: { groupId, userId, status, policyVersion, agreedAt: now, joinedAt: status === "ACTIVE" ? now : null, waitlistedAt: status === "WAITLISTED" ? now : null },
        select: { id: true },
      });
      membershipId = created.id;
    }
    await tx.squadConsentEvent.create({ data: { membershipId, action: "OPT_IN", policyVersion, createdAt: now } });
    await tx.squadNotification.create({ data: { userId, groupId, kind: status === "ACTIVE" ? "JOINED" : "WAITLISTED" } });
    return status;
  });
}

export async function leaveSquad(groupId: string, userId: string): Promise<boolean> {
  return withSerializableRetry(async (tx) => {
    const membership = await tx.squadMembership.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true, status: true, policyVersion: true } });
    if (!membership || !["ACTIVE", "WAITLISTED"].includes(membership.status)) return false;
    const wasActive = membership.status === "ACTIVE";
    const now = new Date();
    await tx.squadMembership.update({ where: { id: membership.id }, data: { status: "LEFT", leftAt: now } });
    if (membership.policyVersion) await tx.squadConsentEvent.create({ data: { membershipId: membership.id, action: "OPT_OUT", policyVersion: membership.policyVersion, createdAt: now } });
    if (wasActive) {
      await tx.accountabilityGroup.updateMany({ where: { id: groupId, currentMemberCount: { gt: 0 } }, data: { currentMemberCount: { decrement: 1 } } });
      await promoteWaitingMembers(tx, groupId);
    }
    await tx.squadNotification.create({ data: { userId, groupId, kind: "LEFT" } });
    return true;
  });
}

export async function removeSquadMember(membershipId: string): Promise<boolean> {
  return withSerializableRetry(async (tx) => {
    const membership = await tx.squadMembership.findUnique({ where: { id: membershipId }, select: { id: true, groupId: true, userId: true, status: true } });
    if (!membership || !["ACTIVE", "WAITLISTED"].includes(membership.status)) return false;
    const wasActive = membership.status === "ACTIVE";
    await tx.squadMembership.update({ where: { id: membership.id }, data: { status: "REMOVED", leftAt: new Date() } });
    if (wasActive) {
      await tx.accountabilityGroup.updateMany({ where: { id: membership.groupId, currentMemberCount: { gt: 0 } }, data: { currentMemberCount: { decrement: 1 } } });
      await promoteWaitingMembers(tx, membership.groupId);
    }
    await tx.squadNotification.create({ data: { userId: membership.userId, groupId: membership.groupId, kind: "REMOVED" } });
    return true;
  });
}

export { promoteWaitingMembers, withSerializableRetry };
