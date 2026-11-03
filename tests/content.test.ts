import test from "node:test";
import assert from "node:assert/strict";
import { getYouTubeId, safeExternalUrl } from "../src/lib/content";

test("accepts only standard YouTube video URL formats", () => {
  assert.equal(getYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(getYouTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(getYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(getYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

test("rejects malformed or non-YouTube video URLs", () => {
  assert.equal(getYouTubeId("javascript:alert(1)"), null);
  assert.equal(getYouTubeId("http://youtu.be/dQw4w9WgXcQ"), null);
  assert.equal(getYouTubeId("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(getYouTubeId("https://youtu.be/dQw4w9WgXcQ/extra"), null);
  assert.equal(getYouTubeId("not a url"), null);
});

test("external resources require HTTPS and reject embedded credentials", () => {
  assert.equal(safeExternalUrl("https://example.org/resource")?.hostname, "example.org");
  assert.equal(safeExternalUrl("http://example.org/resource"), null);
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalUrl("https://user:password@example.org/resource"), null);
  assert.equal(safeExternalUrl("not a url"), null);
});
