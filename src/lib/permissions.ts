import "server-only";
import { getPrisma } from "@/lib/prisma";
import { isEntitlementActive } from "@/lib/entitlement-policy";
import { requireUser } from "@/lib/security";

export async function hasEntitlement(userId: string, key: string, now = new Date()): Promise<boolean> {
  const entitlement = await getPrisma().entitlement.findUnique({
    where: { userId_key: { userId, key } },
    select: { revokedAt: true, expiresAt: true },
  });
  return entitlement ? isEntitlementActive(entitlement, now) : false;
}

export async function requireEntitlement(key: string) {
  const user = await requireUser();
  if (!user || !(await hasEntitlement(user.id, key))) return null;
  return user;
}
