# Testing Checklist

Comprehensive validation for the AI Job Hunt Toolkit. Run these tests before any public release.

## Layer 1: Consolidation Verification

- [ ] **Test 1: Fresh install smoke test.** Clone repo to temp folder, copy templates to a new project folder, copy agents. Start job-coach. Verify onboarding triggers. Complete it. Verify no `[YOUR_` strings remain in the User Configuration section of CLAUDE.md. (PERSONAL_INFO.md may still have placeholders if extended info was skipped.)

- [ ] **Test 2: Agent config resolution.** After onboarding, invoke each agent with a minimal task. Verify each finds the user's name and contact info from CLAUDE.md:
  - resume-optimizer: reads name for filename
  - linkedin-outreach: includes contact info in message
  - cover-letter-optimizer: includes name in doc structure
  - job-applicator: reads PERSONAL_INFO.md for extended fields
  - contact-discovery: greets with correct context

- [ ] **Test 3: Optional field handling.** Run onboarding, skip portfolio and target role. Verify:
  - Fields are blank in CLAUDE.md (not `[YOUR_PORTFOLIO]`)
  - Agents that use portfolio gracefully omit it
  - Coach-tools that reference target role ask the user

- [ ] **Test 4: Relative path resolution.** Verify agents find MASTER_BULLETS.md etc. using relative paths from project root.

- [ ] **Test 5: ATS tips append.** Verify job-applicator writes a new tip to ATS_TIPS.md after completing an application.

- [ ] **Test 5a: Non-coach agent before onboarding.** Start resume-optimizer AND linkedin-outreach in a project with unfilled CLAUDE.md. Verify both detect incomplete setup and tell the user to run job-coach first.

- [ ] **Test 5b: Missing CLAUDE.md.** Start job-coach in a directory with no CLAUDE.md. Verify it explains the problem and stops.

- [ ] **Test 5c: Partial onboarding re-entry.** Start onboarding, fill in 3 fields, quit. Restart job-coach. Verify it picks up where it left off (only asks about remaining placeholder fields).

- [ ] **Test 5d: Output format placeholders preserved.** After full onboarding, grep all agent files for `[YOUR_`. Verify remaining instances are ONLY in output format reference sections (Style Reference tables, Document Structure examples) in resume-optimizer.md and cover-letter-optimizer.md, and the job-coach.example.md file.

- [ ] **Test 5e: Placeholder detection scoping.** Add a `[YOUR_EXAMPLE]` string inside a comment below the User Configuration section. Verify onboarding does NOT trigger on it.

- [ ] **Test 5f: Setup assistant trigger.** Start job-coach with completed CLAUDE.md but no MCP configured. Verify the coach detects the missing MCP connection and launches setup-assistant.

- [ ] **Test 5g: Setup assistant skip.** Start job-coach with MCP already working. Verify step 2 passes silently.

- [ ] **Test 5h: Content bootstrapping trigger.** Start job-coach with config complete, MCP working, but empty master files. Verify the coach detects empty files and offers to parse an existing resume.

- [ ] **Test 5i: Content bootstrapping skip.** Start job-coach with populated master files. Verify step 4 passes silently.

- [ ] **Test 5j: Resume parsing.** Share a sample resume during content bootstrapping. Verify it populates MASTER_BULLETS.md (bullets organized by company), MASTER_SKILLS.md (categorized skills), and MASTER_PROFILES.md (draft profile).

## Layer 2: Full Toolkit Integration

- [ ] **Test 6: Schema deployment.** Run `schema.sql` against a fresh Supabase project. Verify all tables, constraints, and RPC functions create cleanly. Verify `set_triage_rank()` works.

- [ ] **Test 7: MCP server.** Deploy edge function. Verify core tools respond: `add_company`, `add_job_posting`, `search_job_postings`, `submit_application`, `update_application`, `get_networking_queue`, `get_pipeline_overview`, `add_job_contact`, `schedule_interview`. Verify attribution enforcement.

- [ ] **Test 8: Skill file.** Load the job-hunt-mcp skill in Claude Code. Verify it provides correct MCP guidance.

- [ ] **Test 9: Extension scripts.** Run each script and verify it doesn't crash (even without notification credentials):
  - `daily-status.ts --mode daily` produces a "last 7 days" summary and "next steps" list
  - `daily-status.ts --mode weekly-summary` produces a weekly activity summary
  - `enrich-job-postings.ts` runs without errors
  - `posting-maintenance.ts` runs without errors
  - Old modes (kickoff, checkin, warning, scorecard) are gone and old plist files deleted

- [ ] **Test 10: End-to-end walkthrough.** Starting from completed onboarding:
  - Triage a job posting via job-coach
  - Research contacts via contact-discovery
  - Draft outreach via linkedin-outreach
  - Create a resume via resume-optimizer
  - Draft a cover letter via cover-letter-optimizer
  - Verify pipeline state in DB at each step
