import assert from "node:assert/strict";
import test from "node:test";
import { deletionRequestSchema, lessonProgressSchema, profileSchema } from "@/lib/member-validation";

test("profile names are trimmed and bounded", () => {
  assert.deepEqual(profileSchema.parse({ name: "  Kai  " }), { name: "Kai" });
  assert.equal(profileSchema.safeParse({ name: "x".repeat(81) }).success, false);
});

test("lesson progress accepts only a bounded id and boolean string", () => {
  assert.equal(lessonProgressSchema.safeParse({ lessonId: "lesson-1", completed: "true" }).success, true);
  assert.equal(lessonProgressSchema.safeParse({ lessonId: "lesson-1", completed: "yes" }).success, false);
});

test("account deletion requests require an exact confirmation", () => {
  assert.equal(deletionRequestSchema.safeParse({ confirmation: "DELETE", intent: "request" }).success, true);
  assert.equal(deletionRequestSchema.safeParse({ confirmation: "delete", intent: "request" }).success, false);
});
