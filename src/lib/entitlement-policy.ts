export type EntitlementWindow = { revokedAt: Date | null; expiresAt: Date | null };

export function isEntitlementActive(entitlement: EntitlementWindow, now = new Date()): boolean {
  return entitlement.revokedAt === null && (entitlement.expiresAt === null || entitlement.expiresAt > now);
}
