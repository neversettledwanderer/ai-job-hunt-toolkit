---
name: job-hunt-mcp
description: "Guardrails for the job-hunt MCP server -- prevents common agent mistakes when tracking job applications. Use this skill whenever the user mentions job search, job applications, job postings, resume tracking, application status, interview scheduling, application pipeline, cover letters for applications, or wants to look up, add, or update anything related to their job hunt. Also trigger when you see mcp__job-hunt__* tools available or when the user asks about their application pipeline or hiring status."
---

The `mcp__job-hunt__*` tools are well-documented in their schemas -- read those for parameters and usage. This skill covers the things agents consistently get wrong.

## When the MCP server shows "requires authentication"

The job-hunt MCP uses API key auth, NOT OAuth. The `mcp__job-hunt__authenticate` tool will always fail because there is no OAuth flow to complete. **Do not tell the user to "run /mcp and authenticate manually"** -- that does not work either.

If you see only `mcp__job-hunt__authenticate` and no other `mcp__job-hunt__*` tools, the MCP server connection is broken. Tell the user:
- "The job-hunt MCP server isn't connected. Try opening `/mcp`, disabling the job-hunt server, then re-enabling it. That usually reconnects it."
- If that doesn't work, they may need to restart Claude Code.
- Then offer to query the database directly via curl as a workaround if they need data now.

The server URL with key is: `[YOUR_SUPABASE_URL]/functions/v1/job-hunt-mcp?key=[YOUR_API_KEY]`

## Postings and applications are separate things

A **job posting** is a role the user is interested in. An **application** is a record that the user has (or intends to) apply. These are independent:

- **"Add this job to my pipeline"** = `add_job_posting` only. Do NOT also create an application. The user is just bookmarking it.
- **"I applied to this"** = find the posting, then `submit_application` with `status: "applied"`.
- **"I haven't actually applied to this"** or **"un-apply"** = `delete_application` (keeps the posting). There is no "not applied" status -- you delete the application record.

## Status flow

```
draft -> ready -> applied -> screening -> interviewing -> offer -> accepted
                                                              -> rejected
                                                     -> withdrawn (at any point)
```

- **draft**: The initial status when an application is created before the resume has been reviewed. Typically set by the resume-optimizer agent.
- **ready**: Resume reviewed, not yet applied. Use this (not "draft") when creating applications manually.
- Statuses only move forward. Don't skip steps (e.g., don't go straight from "applied" to "offer").

## Non-obvious patterns

**Finding unprocessed postings:** `search_job_postings` with `has_application: false` returns postings that have no application record yet.

**When something isn't found:** If the user says "update my [Company] application" but search returns nothing, ask for clarification. Don't create phantom postings.

**Tracking a rejection:** Search for the posting first, then `update_application` with `status: "rejected"` and `response_date`. Don't use `submit_application` to create a new rejected record.

**Upsert behavior:** `add_job_posting` upserts on URL -- calling it with an existing URL updates the record rather than creating a duplicate.

## Attribution (required)

Every call to `add_job_posting` and `submit_application` MUST include `created_by` identifying the actor. This is a required field and calls will fail without it.

Every call to `update_application` MUST include `actor` identifying who is making the change.
