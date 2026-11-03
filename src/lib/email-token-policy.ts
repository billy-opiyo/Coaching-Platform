import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function hashEmailToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createBlueprintAccessToken(leadId: string, guideVersion: string, expiresAt: Date, secret: string): string {
  const payload = `${leadId}.${guideVersion}.${expiresAt.getTime()}`;
  const signature = createHmac("sha256", secret).update(`blueprint:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyBlueprintAccessToken(token: string, secret: string, now = new Date()): { leadId: string; guideVersion: string; expiresAt: Date } | null {
  const [leadId, guideVersion, expiry, signature, ...extra] = token.split(".");
  if (!leadId || !guideVersion || !expiry || !signature || extra.length || !/^\d{13}$/.test(expiry)) return null;
  const expiresAt = new Date(Number(expiry));
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= now) return null;
  const payload = `${leadId}.${guideVersion}.${expiry}`;
  const expected = createHmac("sha256", secret).update(`blueprint:${payload}`).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  return { leadId, guideVersion, expiresAt };
}

export function createUnsubscribeToken(consentEventId: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(`unsubscribe:${consentEventId}`).digest("base64url");
  return `${consentEventId}.${signature}`;
}

export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  const [consentEventId, signature, ...extra] = token.split(".");
  if (!consentEventId || !signature || extra.length) return null;
  const expected = createHmac("sha256", secret).update(`unsubscribe:${consentEventId}`).digest();
  const supplied = Buffer.from(signature, "base64url");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied) ? consentEventId : null;
}
