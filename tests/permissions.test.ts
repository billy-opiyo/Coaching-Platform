import assert from "node:assert/strict";
import test from "node:test";
import { isEntitlementActive } from "@/lib/entitlement-policy";

test("entitlements require no revocation and no elapsed expiry", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  assert.equal(isEntitlementActive({ revokedAt: null, expiresAt: null }, now), true);
  assert.equal(isEntitlementActive({ revokedAt: null, expiresAt: new Date("2026-11-03T12:00:01Z") }, now), true);
  assert.equal(isEntitlementActive({ revokedAt: null, expiresAt: now }, now), false);
  assert.equal(isEntitlementActive({ revokedAt: now, expiresAt: null }, now), false);
});
