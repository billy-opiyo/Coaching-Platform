import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { isInsideDirectory } from "@/lib/blueprint-path-policy";

test("private guide paths cannot point into the public directory", () => {
  const publicDir = path.resolve("public");
  assert.equal(isInsideDirectory(publicDir, path.join(publicDir, "guide.pdf")), true);
  assert.equal(isInsideDirectory(publicDir, path.resolve("private", "guide.pdf")), false);
});
