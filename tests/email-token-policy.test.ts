import assert from "node:assert/strict";
import test from "node:test";
import { createBlueprintAccessToken, createUnsubscribeToken, hashEmailToken, verifyBlueprintAccessToken, verifyUnsubscribeToken } from "@/lib/email-token-policy";

const secret = "test-secret-for-unit-tests";

test("Blueprint tokens are signed, versioned, time-limited, and stored as hashes", () => {
  const expiry = new Date("2026-11-05T12:00:00Z");
  const token = createBlueprintAccessToken("lead_123", "v1", expiry, secret);
  assert.deepEqual(verifyBlueprintAccessToken(token, secret, new Date("2026-11-04T12:00:00Z")), { leadId: "lead_123", guideVersion: "v1", expiresAt: expiry });
  assert.equal(verifyBlueprintAccessToken(token, "wrong-secret", new Date("2026-11-04T12:00:00Z")), null);
  assert.equal(verifyBlueprintAccessToken(token, secret, expiry), null);
  assert.notEqual(hashEmailToken(token), token);
});

test("unsubscribe tokens authenticate the consent event without placing it in a query", () => {
  const token = createUnsubscribeToken("consent_123", secret);
  assert.equal(verifyUnsubscribeToken(token, secret), "consent_123");
  assert.equal(verifyUnsubscribeToken(`${token}tampered`, secret), null);
});
