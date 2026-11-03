import assert from "node:assert/strict";
import test from "node:test";
import { getSquadPolicyVersion, hasAvailableSquadSeat, isSquadPolicyApproved } from "../src/lib/squad-policy";
import { currentSquadWeekStart, squadCheckInSchema, squadSchema } from "../src/lib/squad-validation";

test("squads fail closed unless both policy approval and a version are configured", () => {
  const previousApproved = process.env.SQUADS_POLICIES_APPROVED;
  const previousVersion = process.env.SQUADS_POLICY_VERSION;
  const previousText = process.env.SQUADS_POLICY_TEXT;
  try {
    delete process.env.SQUADS_POLICIES_APPROVED;
    delete process.env.SQUADS_POLICY_VERSION;
    delete process.env.SQUADS_POLICY_TEXT;
    assert.equal(isSquadPolicyApproved(), false);
    process.env.SQUADS_POLICIES_APPROVED = "true";
    assert.equal(isSquadPolicyApproved(), false);
    process.env.SQUADS_POLICY_VERSION = "community-v1";
    assert.equal(isSquadPolicyApproved(), false);
    process.env.SQUADS_POLICY_TEXT = "These approved guidelines explain expected conduct and how members can request help.";
    assert.equal(isSquadPolicyApproved(), true);
    assert.equal(getSquadPolicyVersion(), "community-v1");
  } finally {
    if (previousApproved === undefined) delete process.env.SQUADS_POLICIES_APPROVED;
    else process.env.SQUADS_POLICIES_APPROVED = previousApproved;
    if (previousVersion === undefined) delete process.env.SQUADS_POLICY_VERSION;
    else process.env.SQUADS_POLICY_VERSION = previousVersion;
    if (previousText === undefined) delete process.env.SQUADS_POLICY_TEXT;
    else process.env.SQUADS_POLICY_TEXT = previousText;
  }
});

test("capacity decisions never allocate beyond the configured limit", () => {
  assert.equal(hasAvailableSquadSeat(7, 8, true), true);
  assert.equal(hasAvailableSquadSeat(8, 8, true), false);
  assert.equal(hasAvailableSquadSeat(0, 8, false), false);
});

test("squad capacity, weekly check-in lengths, and Monday dates are validated", () => {
  assert.equal(squadSchema.safeParse({ name: "Focus group", description: "A small group for practical accountability and regular mutual support.", capacity: "8", status: "DRAFT" }).success, true);
  assert.equal(squadSchema.safeParse({ name: "x", description: "short", capacity: "101", status: "OPEN" }).success, false);
  assert.equal(squadCheckInSchema.safeParse({ membershipId: "membership1", weekStart: "2026-11-02", focus: "One clear task", reflection: "I made progress." }).success, true);
  assert.equal(squadCheckInSchema.safeParse({ membershipId: "membership1", weekStart: "2026-11-03", focus: "One clear task", reflection: "I made progress." }).success, false);
});

test("squad weeks begin on Monday in UTC", () => {
  assert.equal(currentSquadWeekStart(new Date("2026-11-04T12:00:00Z")).toISOString(), "2026-11-02T00:00:00.000Z");
});
