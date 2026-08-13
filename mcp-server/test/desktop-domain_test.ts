import { assertEquals } from "jsr:@std/assert@1";
import { isStaleWrite, reviewedAssetsMatch, validateApplicationTransition } from "../../supabase/functions/_shared/desktop-domain.ts";

Deno.test("validates controlled application transitions", () => {
  assertEquals(validateApplicationTransition("draft", "ready", null), null);
  assertEquals(validateApplicationTransition("draft", "offer", null), "Application cannot move from draft to offer.");
  assertEquals(validateApplicationTransition("ready", "applied", null), "An applied date is required when an application is applied.");
  assertEquals(validateApplicationTransition("applied", "applied", null), "An applied date is required when an application is applied.");
  assertEquals(validateApplicationTransition("ready", "applied", "2026-08-13"), null);
});

Deno.test("detects optimistic concurrency conflicts", () => {
  assertEquals(isStaleWrite(undefined, "2026-08-13T10:00:00Z"), false);
  assertEquals(isStaleWrite("2026-08-13T10:00:00Z", "2026-08-13T10:00:00.000Z"), false);
  assertEquals(isStaleWrite("2026-08-13T10:00:00Z", "2026-08-13T10:00:01Z"), true);
});

Deno.test("invalidates a review when any package asset changes or is added", () => {
  assertEquals(reviewedAssetsMatch({ resume: "hash-a" }, { resume: "hash-a" }), true);
  assertEquals(reviewedAssetsMatch({ resume: "hash-a" }, { resume: "hash-b" }), false);
  assertEquals(reviewedAssetsMatch({ resume: "hash-a" }, { resume: "hash-a", cover: "hash-c" }), false);
  assertEquals(reviewedAssetsMatch({}, {}), false);
});
