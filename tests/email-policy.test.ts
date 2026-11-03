import assert from "node:assert/strict";
import test from "node:test";
import { canRetryEmail, consentAllowsSend, isEmailTemplateReady, scheduleEmailStep } from "@/lib/email-policy";

test("marketing sends require the exact latest opt-in version", () => {
  const enrollment = { consentEventId: "consent-1", consentVersion: "v2" };
  assert.equal(consentAllowsSend({ id: "consent-1", action: "OPT_IN", consentVersion: "v2" }, enrollment), true);
  assert.equal(consentAllowsSend({ id: "consent-2", action: "OPT_IN", consentVersion: "v2" }, enrollment), false);
  assert.equal(consentAllowsSend({ id: "consent-1", action: "OPT_OUT", consentVersion: "v2" }, enrollment), false);
  assert.equal(consentAllowsSend({ id: "consent-1", action: "OPT_IN", consentVersion: "v1" }, enrollment), false);
});

test("draft email text cannot be enabled", () => {
  assert.equal(isEmailTemplateReady("A reviewed subject", "An owner-approved message with sufficient plain text content."), true);
  assert.equal(isEmailTemplateReady("[Draft] subject", "An owner-approved message with sufficient plain text content."), false);
});

test("retry window ends before provider idempotency expires", () => {
  const created = new Date("2026-11-03T00:00:00Z");
  assert.equal(canRetryEmail(2, created, new Date("2026-11-03T22:00:00Z")), true);
  assert.equal(canRetryEmail(5, created, new Date("2026-11-03T01:00:00Z")), false);
  assert.equal(canRetryEmail(2, created, new Date("2026-11-03T23:30:00Z")), false);
});

test("sequence delay is calculated from the consent start time", () => {
  const started = new Date("2026-11-03T12:00:00Z");
  assert.equal(scheduleEmailStep(started, 3).toISOString(), "2026-11-06T12:00:00.000Z");
});
