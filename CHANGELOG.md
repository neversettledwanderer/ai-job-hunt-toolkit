# Changelog

## [Unreleased] - 2026-07-19

### Added
- New agent `application-reviewer`: standalone, read-only, adversarial review of a completed resume + cover letter package before submission, from the perspective of a sceptical recruiter screening for the specific role and level. Extracts actual file content (paragraphs, tables, headers/footers, metadata, tracked changes) rather than trusting a builder agent's self-reported summary of what it changed. Cross-checks every claim against the canonical master files (Verified / Contradicted / Unverifiable), maps JD requirements line by line, and returns findings in three tiers: Must-fix (blocks submission), Interview-prep (doesn't block, appended to prep notes), Minor. Never edits documents itself -- routes Must-fix findings back to `resume-optimizer` or `cover-letter-optimizer`, with a maximum of two fix/review rounds before escalating to the user.

### Changed
- `agents/job-applicator.md`: added a mandatory Pre-Submission Review gate (new Step 5, alongside the existing networking gate) that blocks submission unless the application record shows a `PRE-SUBMISSION REVIEW: PASS` verdict dated after the resume and cover letter were last modified. Subsequent steps renumbered.
- `agents/job-coach.md`: updated the state-machine step count reference (8-step → 9-step) to include the new review step.
- `coach-tools/execution-workflow.md`: inserted Pre-Submission Review as its own step in the state machine (between Cover Letter and Apply), renumbering Apply and Post-Apply Outreach; updated the "Deriving what's next" and "Who does what" reference tables to match.
- `templates/CLAUDE.md`: added an "Application Gates" section documenting both the networking gate and the new pre-submission review gate, and listed `application-reviewer` under Agent Instructions.
- `README.md`: agent count 10 → 11 (diagram and components table), execution workflow diagram now shows the review step, and added an "Application Gates" section explaining both gates and how `application-reviewer` works.

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
