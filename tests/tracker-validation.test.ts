import assert from "node:assert/strict";
import test from "node:test";
import { isFutureTrackerDate, trackerEntrySchema } from "../src/lib/tracker-validation";

test("tracker entries accept bounded scores and optional short reflections", () => {
  const parsed = trackerEntrySchema.safeParse({ entryDate: "2026-11-03", mood: "4", energy: "3", stress: "2", reflection: "A quiet day." });
  assert.equal(parsed.success, true);
});

test("tracker validation rejects invalid dates, out-of-range scores, and long reflections", () => {
  assert.equal(trackerEntrySchema.safeParse({ entryDate: "2026-02-30", mood: "4", energy: "3", stress: "2", reflection: "" }).success, false);
  assert.equal(trackerEntrySchema.safeParse({ entryDate: "2026-11-03", mood: "6", energy: "3", stress: "2", reflection: "" }).success, false);
  assert.equal(trackerEntrySchema.safeParse({ entryDate: "2026-11-03", mood: "4", energy: "3", stress: "2", reflection: "x".repeat(501) }).success, false);
});

test("future check-ins are not accepted", () => {
  assert.equal(isFutureTrackerDate("2026-11-04", new Date("2026-11-03T12:00:00Z")), true);
  assert.equal(isFutureTrackerDate("2026-11-03", new Date("2026-11-03T12:00:00Z")), false);
});
