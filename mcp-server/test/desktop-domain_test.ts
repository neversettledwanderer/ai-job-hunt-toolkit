import { assertEquals } from "jsr:@std/assert@1";
import { isStaleWrite, mapLegacyErrorCode, reviewedAssetsMatch, selectAttachedPackageAssets, validateApplicationTransition } from "../../supabase/functions/_shared/desktop-domain.ts";
import { desktopSuccess, ensureStructuredToolResult, runWithDesktopCorrelation } from "../../supabase/functions/_shared/desktop-tools.ts";

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

Deno.test("selects only the exact resume and cover letter attached to the application", () => {
  const assets = [
    { id: "old", asset_type: "resume", relative_path: "Generated/old.docx", content_hash: "old-hash", validation_state: "valid" },
    { id: "current", asset_type: "resume", relative_path: "Generated/current.docx", content_hash: "current-hash", validation_state: "valid" },
    { id: "cover", asset_type: "cover_letter", relative_path: "Generated/cover.docx", content_hash: "cover-hash", validation_state: "valid" },
  ];
  assertEquals(selectAttachedPackageAssets("Generated/current.docx", null, assets).map((asset) => asset.id), ["current"]);
  assertEquals(selectAttachedPackageAssets("Generated/current.docx", "Generated/cover.docx", assets).map((asset) => asset.id), ["current", "cover"]);
  assertEquals(selectAttachedPackageAssets(null, null, assets), []);
});

Deno.test("preserves a request correlation id through asynchronous tool work", async () => {
  const correlationId = "123e4567-e89b-42d3-a456-426614174000";
  const result = await runWithDesktopCorrelation(correlationId, async () => {
    await Promise.resolve();
    return desktopSuccess({ ok: true });
  });
  assertEquals((result.structuredContent as { correlationId: string }).correlationId, correlationId);
  assertEquals(result.content[0].text.includes('"ok": true'), true);
});

Deno.test("adds envelopes and typed errors without changing legacy text", () => {
  const success = ensureStructuredToolResult({ content: [{ type: "text", text: '{"count":2}' }] });
  assertEquals(success.content, [{ type: "text", text: '{"count":2}' }]);
  assertEquals((success.structuredContent as { data: unknown }).data, { count: 2 });
  const failed = ensureStructuredToolResult({ content: [{ type: "text", text: "Application not found" }], isError: true });
  assertEquals((failed.structuredContent as { error: { code: string } }).error.code, "NOT_FOUND");
  assertEquals(mapLegacyErrorCode("Duplicate application already exists"), "CONFLICT");
  assertEquals(mapLegacyErrorCode("LibreOffice is unavailable"), "DEPENDENCY_UNAVAILABLE");
});
