# Changelog

## [Unreleased] - 2026-07-16

### Security
- Rewrote git history to permanently remove `supabase/.temp/*` (project ref, org ID, pooler connection string) that had been committed and then only deleted in a later commit, leaving it recoverable from history. Force-pushed the cleaned history to `main`.

### Changed
- `README.md`: corrected agent count (7 → 10 in the diagram, "Nine" → "Ten" in the components section), documented the `scripts/job-vault.js` credential helper, clarified that scheduled daily job discovery (`daily-job-discovery.ts`) is not yet implemented (on-demand discovery works today), fixed Quick Start to point at this fork and include the root-level `.job-discovery-config.example.yaml`, and added Changelog/fork-credits sections.

## [Unreleased] - 2026-07-15

### Added
- New agent `job-finder-adzuna` for searching UK job boards via the Adzuna API.
- New agents `job-finder-indeed` and `job-finder-linkedin` for Indeed and LinkedIn job discovery.
- New `scripts/job-vault.js` CLI helper for storing ATS/portal credentials in a dedicated macOS Keychain.
- New `.job-discovery-config.example.yaml` template for scheduling job-board searches.
- New `coach-tools/pipeline-api-reference.md` documenting direct HTTP calls to the Supabase Edge Function.
- `Applications Completed/` folder convention documented in `README.md` and `templates/CLAUDE.md`.

### Changed
- `agents/job-coach.md`:
  - Added Step 5b untriaged-queue check at session start.
  - Added on-demand job discovery delegation to `job-finder-*` agents.
  - Added Phase 4 Gated Execution Checklist (Contact Discovery → LinkedIn Outreach → Resume → Cover Letter → Apply).
  - Added post-submission two-step rule (log in DB + move folder together).
- `agents/job-applicator.md`:
  - Default browser switched from Chrome to Comet.
  - Added quick-apply workflows for Indeed Easy Apply and LinkedIn Apply.
  - Added mandatory networking gate before applying.
  - Integrated `job-vault` for ATS/portal credential retrieval.
- `agents/setup-assistant.md`:
  - LinkedIn scraping setup now defaults to Comet browser path.
- `README.md`:
  - Updated agent count from 7 to 10.
  - Documented `Applications Completed/` convention and Comet default.

### Security
- All merged files were sanitized to remove personal data (names, addresses, emails, phone numbers, CVs, API keys, Supabase credentials, and filled master content).
- `scripts/.job-vault-index.json` and `.job-discovery-config.yaml` added to `.gitignore`.
