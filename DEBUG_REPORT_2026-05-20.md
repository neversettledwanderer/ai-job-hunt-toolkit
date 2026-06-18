# Debug Report — ai-job-hunt-toolkit
**Date:** 2026-05-20  
**Status:** Findings identified, fixes pending

---

## Summary

| Severity | Count |
|----------|-------|
| 🚨 Critical | 5 |
| ⚠️ Warning | 10 |
| ℹ️ Info | 5 |

---

## 🚨 CRITICAL — Will cause runtime failures

### C1. `"adzuna"` rejected by Zod validator and DB constraint
**Files:** `mcp-server/index.ts`, `supabase/functions/job-hunt-mcp/index.ts`, `mcp-server/schema/schema.sql`

The `source` field is a Zod enum and a DB `CHECK` constraint. Neither includes `"adzuna"`. Every call from `job-finder-adzuna` using `source = "adzuna"` will be rejected before it hits the database.

**Fix:** Add `"adzuna"` to the enum in both `index.ts` files and to the CHECK constraint in `schema.sql`.

---

### C2. `posting-maintenance.ts` uses a tilde path Deno won't expand
**File:** `extension/scripts/posting-maintenance.ts` line ~100

`pw("state-load", "~/.playwright-auth.json")` — tilde expansion only happens in a shell. `Deno.Command` passes args raw, so the file is never found. `enrich-job-postings.ts` (line 31) does it correctly using `` `${Deno.env.get("HOME")}/.playwright-auth.json` ``.

**Fix:** Replace `"~/.playwright-auth.json"` with `` `${Deno.env.get("HOME")}/.playwright-auth.json` ``

---

### C3. `daily-job-discovery.ts` referenced by all 3 finder agents but doesn't exist
**Files:** `agents/job-finder-indeed.md`, `agents/job-finder-linkedin.md`, `agents/job-finder-adzuna.md`

All agents describe a "Daily Automated Discovery" mode run by this script. The file doesn't exist anywhere in `extension/scripts/`, and there is no launchd plist for it either.

**Fix options:**
- A) Create `extension/scripts/daily-job-discovery.ts` and a matching launchd plist
- B) Update agent docs to remove automation framing and clarify on-demand only (simpler)

---

### C4. `refresh-creds.sh` writes to a directory that may not exist
**File:** `extension/scripts/refresh-creds.sh` line ~14

Writes to `~/.config/job-hunt/creds.json` without a `mkdir -p` first. On a fresh machine this will throw `FileNotFoundError` from Python.

**Fix:** Add `mkdir -p "$(dirname "$CREDS_FILE")"` before the Python write block.

---

### C5. `npx` not in launchd PATH if Node was installed via nvm
**Files:** `extension/scripts/posting-maintenance.ts`, `extension/launchd/com.jobhunt.posting-maintenance.plist`

The plist sets `PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin`. If Node/npm is installed via nvm, `npx` lives at `~/.nvm/versions/node/<version>/bin/npx` — outside this PATH. Script will fail with `npx: command not found` when run on a schedule.

**Fix:** Add the nvm bin path to the plist PATH, or use the absolute path to `npx`. **Needs user input: confirm Node install method and path.**

---

## ⚠️ WARNINGS — Inconsistencies and schema gaps

### W1. No `triaged_at` filter in MCP — job-coach Step 5b can't query untriaged jobs
**Files:** `mcp-server/index.ts`, `supabase/functions/job-hunt-mcp/index.ts`, `agents/job-coach.md`

`job-coach` Step 5b instructs: "Query the pipeline for untriaged jobs (jobs where `triaged_at IS NULL`)." No MCP tool exposes `triaged_at` as a filter. `search_job_postings` has no `triaged_at_is_null` param, and `update_job_posting` has no `triaged_at` write. The column exists in the schema but nothing in the MCP layer reads or writes it.

**Fix:** Add `triaged_at_is_null: z.boolean().optional()` filter to `search_job_postings`, and `triaged_at` write field to `update_job_posting` in both copies of `index.ts`.

---

### W2/W3. `mcp-server/` and `supabase/functions/job-hunt-mcp/` are duplicate copies
**Files:** Both `index.ts` and both `handlers.ts`

Currently byte-for-byte identical. No mechanism prevents them drifting. Any change to one must be manually mirrored.

**Fix (recommendation):** Treat `supabase/functions/job-hunt-mcp/` as canonical. Document that `mcp-server/` is a development reference copy.

---

### W4. `SKILL.md` documents only 5 of 21 MCP tools
**File:** `skills/job-hunt-mcp/SKILL.md`

Documents: `add_job_posting`, `submit_application`, `update_application`, `delete_application`, `search_job_postings`.

Missing (16 tools): `add_company`, `delete_job_posting`, `schedule_interview`, `log_interview_notes`, `get_pipeline_overview`, `get_upcoming_interviews`, `link_contact_to_professional_crm`, `get_attribution_history`, `add_job_contact`, `search_job_contacts`, `update_job_contact`, `delete_job_contact`, `link_contact_to_posting`, `unlink_contact_from_posting`, `update_job_posting`, `get_networking_queue`.

**Fix:** Expand SKILL.md to cover all 21 tools, or at minimum the high-risk ones: `update_job_posting`, `get_networking_queue`, `add_job_contact`, `schedule_interview`.

---

### W5. `templates/.job-discovery-config.example.yaml` has no `adzuna` section
**File:** `templates/.job-discovery-config.example.yaml`

Config template has `indeed` and `linkedin` sections but no `adzuna`. The agent format is documented in `agents/job-finder-adzuna.md`.

**Fix:** Add `adzuna` section to the example YAML.

---

### W6. `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` missing from `.env.example`
**File:** `extension/.env.example`

The Adzuna agent reads credentials from `.env` as `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`. Neither is listed in `.env.example`. Users following the example file have no hint these are needed.

**Fix:** Add both variables to `.env.example` with a comment pointing to `developer.adzuna.com`.

---

### W7. `professional_contacts` table missing from `schema.sql`
**Files:** `mcp-server/schema/schema.sql`, `mcp-server/index.ts`

The `link_contact_to_professional_crm` MCP tool inserts into a `professional_contacts` table and references `professional_crm_contact_id` on `job_contacts`. Neither exists in `schema.sql`. Anyone deploying from the schema file will get a Postgres error when this tool is called.

**Fix:** Add the `professional_contacts` table and `professional_crm_contact_id UUID` column on `job_contacts` to `schema.sql`.

---

### W8. `enrich-job-postings.ts` passes `storageState` to `launchPersistentContext` — silently ignored
**File:** `extension/scripts/enrich-job-postings.ts` lines ~82-86

`launchPersistentContext` ignores the `storageState` option — it uses the user data directory for state, not a storage state file. Auth state from `~/.playwright-auth.json` is never loaded.

**Fix:** Switch to `chromium.launch()` + `browser.newContext({ storageState })` to correctly apply saved auth, or use an actual Chrome persistent profile directory.

---

### W9. `refresh-creds.sh` inlines credential values in Python strings — special chars break JSON
**File:** `extension/scripts/refresh-creds.sh` lines ~30-42

Credentials interpolated directly inside Python string literals: `'supabase_key': '$SUPABASE_KEY'`. A single quote in any credential value will break the Python syntax and the creds file won't be written.

**Fix:** Use `python3 -c "import json, os; ..."` reading values from `os.environ`, or use `jq` to build the JSON file safely.

---

### W10. `launchd-wrapper.sh` error message references wrong filename
**File:** `extension/scripts/launchd-wrapper.sh` line ~9

Error message says: `"ERROR: $CREDS_FILE not found. Run refresh-creds.ts first."` The script is actually `refresh-creds.sh`, not `refresh-creds.ts`.

**Fix:** Change `.ts` to `.sh` in the error message.

---

## ℹ️ INFO — Minor, not breaking

| # | Note | File |
|---|------|------|
| I1 | `weekly_recipients` has no 1Password mapping — falls back to `gmail_email` silently. By design, but undocumented. | `extension/lib/credentials.ts` |
| I2 | Misleading comment in `posting-maintenance.ts` about "leave browser open" — doesn't matter in launchd context | `posting-maintenance.ts` |
| I3 | `mcp-server/index.ts` imports Supabase Edge Runtime types unnecessarily (harmless) | `mcp-server/index.ts` |
| I4 | `job_contacts` missing a single-column index on `company_id` — compound index works but single-column would be faster | `schema.sql` |
| I5 | `setup-assistant.md` says copy from `mcp-server/` — `supabase/functions/job-hunt-mcp/` already exists and can deploy directly | `agents/setup-assistant.md` |

---

## Recommended Fix Order

**Pass 1 — Quick wins (straightforward edits, low risk):**
- C1 — Add `"adzuna"` to source enum + DB constraint
- C2 — Fix tilde path in `posting-maintenance.ts`
- C4 — Add `mkdir -p` in `refresh-creds.sh`
- W5 — Add `adzuna` section to config example YAML
- W6 — Add `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` to `.env.example`
- W10 — Fix filename typo in `launchd-wrapper.sh`

**Pass 2 — Needs decisions:**
- C3 — Create `daily-job-discovery.ts` or remove doc references? (user decides)
- C5 — Fix launchd PATH for nvm users (needs user's Node path)
- W1 — Add `triaged_at` filter to MCP tools (code change in both index.ts copies)
- W7 — Add missing `professional_contacts` table to schema.sql

**Pass 3 — Longer term:**
- W2/W3 — Resolve duplicate MCP server copies
- W4 — Expand SKILL.md to cover all 21 tools
- W8 — Fix Playwright auth state loading in enrich script
- W9 — Harden credential JSON generation in refresh-creds.sh

---

*Report generated 2026-05-20. Audit covered: 5 TypeScript scripts, 5 library modules, 2 MCP server files, 1 schema SQL, 4 launchd plists, 2 shell scripts, 10 agent files, 1 skills file, 1 config template.*
