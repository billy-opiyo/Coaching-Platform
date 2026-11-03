import "server-only";
import { createBlueprintAccessToken as signBlueprint, createUnsubscribeToken as signUnsubscribe, hashEmailToken, verifyBlueprintAccessToken as checkBlueprint, verifyUnsubscribeToken as checkUnsubscribe } from "@/lib/email-token-policy";

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Token signing is not configured.");
  return value;
}

export { hashEmailToken };
export function createBlueprintAccessToken(leadId: string, guideVersion: string, expiresAt: Date): string { return signBlueprint(leadId, guideVersion, expiresAt, secret()); }
export function verifyBlueprintAccessToken(token: string) { return checkBlueprint(token, secret()); }
export function createUnsubscribeToken(consentEventId: string): string { return signUnsubscribe(consentEventId, secret()); }
export function verifyUnsubscribeToken(token: string): string | null { return checkUnsubscribe(token, secret()); }
