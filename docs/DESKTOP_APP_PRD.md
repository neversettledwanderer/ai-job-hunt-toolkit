# AI Job Hunt Desktop — Product Requirements Document

**Status:** Implementation-ready draft  
**Product:** AI Job Hunt Toolkit desktop application  
**Initial platform:** macOS 13+  
**Future platforms:** Windows 11 and supported Linux distributions  
**Production stack:** Electron, React, TypeScript, Supabase, Claude Agent SDK, MCP  
**Prototype:** `desktop-prototype/`  
**Last updated:** 13 August 2026

---

## 1. Executive summary

The AI Job Hunt Toolkit currently provides a powerful CLI workflow built around specialised Claude Code agents, a Supabase-backed MCP server, local career documents, macOS Keychain credentials, browser automation, and scheduled jobs. It is capable, but its command-line interface makes pipeline state, prioritisation, multi-step application readiness, and historical activity harder to understand at a glance.

AI Job Hunt Desktop will add a visual desktop interface without removing or weakening the existing CLI. The desktop app will use the same Supabase records and domain rules so that work completed from either interface remains consistent. Its first release will focus on pipeline visibility and safe workflow orchestration. AI-generated documents and browser-assisted applications will be added through isolated workers with explicit user approval gates.

The production application will be built as an Electron desktop app with a React/TypeScript renderer. Privileged activities—including secrets, filesystem access, AI execution, MCP communication, and Playwright browser automation—will run outside the renderer. The React interface will communicate with the Electron main process through a deliberately small, typed IPC bridge.

The included frontend prototype demonstrates the intended information architecture, hierarchy, and interaction model using representative local data. It intentionally performs no network calls and does not read credentials or user files.

---

## 2. Background and current system

### 2.1 Existing architecture

The current toolkit consists of:

- Specialised agent instruction files under `agents/`.
- Coaching frameworks and execution rules under `coach-tools/`.
- A Supabase Edge Function MCP server under `mcp-server/` and `supabase/functions/job-hunt-mcp/`.
- A PostgreSQL schema for companies, job postings, applications, interviews, contacts, daily statistics, and attribution history.
- Local Markdown and Word documents containing personal information, experience bullets, profiles, skills, cover letters, and job-specific output.
- macOS Keychain-backed ATS login storage through `scripts/job-vault.js`.
- Playwright-driven browser application workflows.
- macOS `launchd` automations for maintenance and notifications.

### 2.2 Existing domain behaviour that must be preserved

The desktop app must preserve these system invariants:

1. A job posting and an application are separate entities.
2. Saving a posting must not implicitly mark it as applied.
3. Application statuses move through a controlled lifecycle.
4. Every material write is attributable to a human, agent, or automation.
5. Triage ranks are unique within a priority tier.
6. Networking must have started before application submission unless the user explicitly overrides the gate.
7. A current passing pre-submission review is required before submission unless the user explicitly overrides the gate.
8. Overrides must never be silent; the application record must store the reason.
9. Browser automation must pause for review and must not submit without explicit user confirmation.
10. ATS credentials must remain in an operating-system credential store, not in renderer state, browser storage, logs, or tracked files.

### 2.3 Current limitations

- Pipeline state is distributed across database queries, local files, and agent conversation context.
- Users must remember agent names and invocation patterns.
- Triage is text-based and difficult to compare spatially.
- Application readiness gates are only visible when an agent reaches them.
- Upcoming interviews and stale follow-ups are not persistently visible.
- Long-running AI and browser tasks have limited visual progress feedback.
- Local documents are discoverable by convention rather than through a unified workspace.
- The current MCP authentication model is suitable for a personal setup but not for a distributable multi-user desktop product.

---

## 3. Product vision

Create a calm, trustworthy desktop workspace that shows the entire job search clearly, recommends the next highest-value action, and lets the user safely run AI-assisted workflows without needing to remember terminal commands.

The application should feel like a focused personal operating system for a job search—not a generic CRM, a mass-application tool, or an autonomous bot that takes consequential actions without review.

### 3.1 Product principles

1. **One source of truth:** CLI and GUI operate on the same records and rules.
2. **Human control at consequential moments:** applying, sending outreach, modifying source documents, and overriding safeguards require explicit confirmation.
3. **Explain the next action:** the interface should show why something is recommended or blocked.
4. **Progressive disclosure:** overview first; detailed history, requirements, and diagnostics on demand.
5. **Local secrets stay local:** credentials remain outside the renderer and never enter logs.
6. **Agents are workflows, not personas to memorise:** users choose outcomes such as “Tailor resume,” and the system routes to the correct agent.
7. **No silent state changes:** every write has visible feedback and an attribution record.
8. **Graceful coexistence:** using the CLI must never corrupt, fork, or confuse desktop state.

---

## 4. Goals and success measures

### 4.1 Product goals

- Give the user a reliable daily view of pipeline health and next actions.
- Reduce the time required to triage newly discovered roles.
- Make application readiness and blockers visible before the user begins an application.
- Provide one-click entry into specialised AI workflows.
- Make generated documents and their review freshness easy to understand.
- Preserve the existing CLI as a supported interface.
- Establish a secure architecture that can later support multiple authenticated users.

### 4.2 Initial success measures

The product should collect telemetry only with consent. For local-only deployments, these measures can be calculated locally and shown to the user.

| Measure | Baseline | MVP target |
|---|---:|---:|
| Median time to triage five roles | Unknown | Under 5 minutes |
| Users who can identify their top next action without CLI help | Unknown | 90% in usability testing |
| Application records with visible readiness state | Not applicable | 100% |
| Consequential actions executed without explicit approval | Must remain zero | 0 |
| Writes with actor attribution | Existing expectation | 100% |
| Cross-interface state discrepancies | Unknown | 0 known P0/P1 discrepancies |
| Desktop sessions ending in a meaningful workflow action | Unknown | 60%+ after onboarding |

### 4.3 Technical success measures

- Cold launch to usable shell in under 3 seconds on the supported reference Mac.
- Cached pipeline visible within 1 second after the shell renders.
- Fresh pipeline query completes within 2 seconds at the 95th percentile under normal network conditions.
- Renderer contains no service-role, MCP, ATS, or AI provider secret.
- No renderer API allows arbitrary shell execution or unrestricted filesystem access.
- The application can recover from an interrupted agent run without losing the database state or generated documents.

---

## 5. Non-goals

The following are explicitly outside the MVP unless separately approved:

- Fully autonomous job submission.
- Bulk or spam applications.
- Automated LinkedIn scraping.
- Replacing Supabase with a new database.
- Replacing the current CLI or removing existing agent definitions.
- Building a general-purpose professional CRM.
- Native mobile applications.
- Collaborative recruiting-team features.
- Multiple user profiles on the same local operating-system account.
- A public marketplace for agent workflows.
- Silent automatic editing of master career source documents.
- Embedding remote job or ATS pages inside a privileged Electron renderer.

---

## 6. Users and jobs to be done

### 6.1 Primary user

An individual conducting a serious, targeted job search who uses AI to research roles, tailor documents, prepare outreach, and manage applications. The initial user is technically comfortable enough to configure Supabase and API credentials but should not need to use the terminal for normal daily work.

### 6.2 Primary jobs to be done

1. When I start my day, show me the most valuable action so I can make progress without reconstructing context.
2. When jobs are discovered, let me compare and rank them quickly so I focus on the strongest opportunities.
3. When I choose a job, show what is complete, what is blocked, and what comes next.
4. When I tailor a resume or cover letter, keep the workflow connected to the correct job and files.
5. Before I apply, verify networking and review safeguards so I do not submit a weak or stale package accidentally.
6. When I have an interview, gather the relevant role, company, contact, and preparation context in one place.
7. When I return after several days, show outstanding replies, stale applications, deadlines, and agent activity.

---

## 7. Scope and release plan

### 7.1 Prototype scope

The repository prototype demonstrates:

- Desktop application shell and navigation.
- Overview dashboard.
- Job list and priority queue.
- Application pipeline board.
- Applications table.
- Interview schedule.
- Job details drawer and readiness steps.
- Simulated AI Coach interaction.
- Simulated add-job flow.
- Search and visual filtering.
- Responsive layout suitable for desktop review.

The prototype uses in-memory sample data. It does not include Electron, React, Supabase, MCP, filesystem, Keychain, AI, or Playwright integration.

### 7.2 MVP production scope

The production MVP includes:

- Electron application shell.
- Supabase authentication or a clearly marked personal local connection mode.
- Read/write pipeline management.
- Dashboard, jobs, pipeline, applications, interviews, contacts, and activity history.
- Job triage and atomic rank management.
- Local workspace selection and safe file indexing.
- Credential health checks without exposing secret values.
- Agent execution for coach, resume, cover letter, review, and outreach workflows.
- Streaming task progress and approval prompts.
- Application readiness gates.
- Playwright-assisted form filling with explicit final submission confirmation.
- Local notifications for deadlines, interviews, and task completion.
- Crash-safe run history and resumption state.
- Signed and notarised macOS build.

### 7.3 Post-MVP candidates

- Windows and Linux packaging.
- Configurable job discovery schedules.
- Cross-device session history.
- Supabase Realtime updates.
- Calendar integration.
- Email reply detection.
- Local analytics and weekly review reports.
- Multiple workspaces.
- Model/provider configuration.
- Exportable anonymised pipeline report.

---

## 8. Information architecture

### 8.1 Global navigation

1. **Overview** — priorities, metrics, AI Coach recommendation, and compact pipeline.
2. **Pipeline** — application lifecycle board and status transitions.
3. **Jobs** — discovered/saved job postings, search, filters, triage, and ranking.
4. **Applications** — application records, documents, submission dates, and outcomes.
5. **Interviews** — upcoming and historical interviews with preparation state.
6. **Contacts** — people, relationships, outreach status, and linked postings.
7. **Documents** — master content and job-specific files.
8. **Activity** — attribution history, agent runs, errors, and overrides.
9. **Settings** — connection, workspace, credentials, notifications, models, privacy, and diagnostics.

### 8.2 Global chrome

- Workspace identity and connection health.
- Global search.
- Notification centre.
- Primary “Add job” action.
- User/profile menu.
- Background task indicator when agent or browser workers are active.

### 8.3 Job detail navigation

The job detail experience should use a drawer for quick inspection and a full page for deep work. Both surfaces must show the same canonical data.

Suggested tabs on the full job page:

- Overview
- Requirements
- Application
- Networking
- Documents
- Activity

---

## 9. Core user journeys

### 9.1 Daily start

1. User opens the app.
2. App renders cached state and begins a background refresh.
3. App checks connection, local workspace, upcoming interviews, stale follow-ups, untriaged jobs, and incomplete high-priority applications.
4. Overview presents one primary recommendation and up to three supporting tasks.
5. User starts a task or navigates to a work area.
6. Task execution is recorded and visible in Activity.

**Acceptance outcome:** the user understands what deserves attention within ten seconds.

### 9.2 Add and triage a job

1. User chooses “Add job” or a discovery workflow creates a posting.
2. User enters a URL and optional role information.
3. System normalises the URL and checks for an existing posting.
4. System creates or updates the posting without creating an application.
5. Posting appears in the untriaged queue.
6. User assigns High, Medium, or Low priority and a rank within that tier.
7. System performs the rank change atomically.
8. Attribution history records the change.

**Edge cases:** malformed URL, duplicate URL, missing company, closed posting, rank conflict, offline state.

### 9.3 Tailor a resume

1. User selects a job and chooses “Tailor resume.”
2. System checks workspace and source document availability.
3. System creates or finds a draft application record.
4. Agent worker starts the resume workflow with the correct posting, master files, and allowed tools.
5. UI streams concise progress events.
6. If user input or file approval is needed, the run pauses and presents a clear question.
7. Worker writes a job-specific document through a restricted file service.
8. Verification runs and reports warnings or success.
9. Application record stores the document path and attribution event.
10. Readiness view advances to the next step.

### 9.4 Prepare outreach

1. User opens Networking for a job.
2. System shows linked contacts and the current networking status.
3. User launches contact research or message drafting.
4. Agent worker may perform approved web research but cannot send messages automatically in the MVP.
5. Drafts are displayed for review and copied/exported on request.
6. User marks outreach as sent or logs the outcome.
7. Posting networking status is updated and attributed.

### 9.5 Review application package

1. User starts pre-submission review.
2. Reviewer reads actual document content and metadata from the approved files.
3. Reviewer compares claims against master source files and job requirements.
4. Findings are grouped into Must-fix, Interview-prep, and Minor.
5. Review outcome and timestamp are stored.
6. If files are edited after a passing review, review readiness becomes stale automatically.

### 9.6 Apply with browser assistance

1. User chooses “Apply.”
2. System runs readiness evaluation.
3. If networking is not sufficiently progressed, the app blocks and explains the required next action.
4. If review is missing, failed, or stale, the app blocks and explains why.
5. User may choose an explicit override, enter a reason, and reconfirm.
6. Browser worker launches a visible isolated browser context.
7. Worker detects the application flow and fills one page at a time.
8. After each page, UI pauses for user review.
9. The final submission button is never pressed without an explicit confirmation associated with that exact application and page state.
10. After confirmed success, the application status and applied date are updated.
11. Job folder archival occurs only after both database update and filesystem move can be completed safely; otherwise the app reports a recoverable partial state.

### 9.7 Interview preparation

1. User opens an upcoming interview.
2. App shows role, company, interview type, people, time, documents, prior notes, and likely focus areas.
3. User starts an interview-prep agent run.
4. Agent creates a concise prep brief using only approved sources and cited web research when applicable.
5. User adds notes and marks preparation complete.
6. After the interview, the app prompts for notes, feedback, and follow-up actions.

---

## 10. Functional requirements

Priority definitions:

- **P0:** required for a safe usable MVP.
- **P1:** expected for MVP unless schedule risk requires deferral.
- **P2:** post-MVP enhancement.

### 10.1 Application shell

| ID | Priority | Requirement |
|---|---|---|
| SHELL-001 | P0 | The app shall provide persistent global navigation for Overview, Pipeline, Jobs, Applications, Interviews, Contacts, Documents, Activity, and Settings. |
| SHELL-002 | P0 | The renderer shall continue to function in a read-only cached mode when the network is unavailable. |
| SHELL-003 | P0 | The app shall show connection health for Supabase/MCP, local workspace, AI provider, and browser worker. |
| SHELL-004 | P0 | The app shall show all active background tasks and allow the user to open their progress details. |
| SHELL-005 | P1 | The app shall support light, dark, and system appearance. |
| SHELL-006 | P1 | Navigation and primary workflows shall be fully operable by keyboard. |

### 10.2 Overview

| ID | Priority | Requirement |
|---|---|---|
| OVR-001 | P0 | Show counts for active postings, active applications, upcoming interviews, and the configured weekly target. |
| OVR-002 | P0 | Show untriaged job count and source breakdown. |
| OVR-003 | P0 | Show one recommended next action with a human-readable explanation. |
| OVR-004 | P0 | Show high-priority jobs ordered by priority and triage rank. |
| OVR-005 | P0 | Show applications requiring attention, including stale follow-up, missing documents, gate blockers, and deadlines. |
| OVR-006 | P1 | Allow the user to dismiss or defer a recommendation and record why. |
| OVR-007 | P1 | Show data freshness and last successful sync. |

### 10.3 Jobs and triage

| ID | Priority | Requirement |
|---|---|---|
| JOB-001 | P0 | List and search job postings by title, company, location, source, priority, status, and application presence. |
| JOB-002 | P0 | Add a posting from a full URL with optional company, title, location, salary, source, dates, and notes. |
| JOB-003 | P0 | Normalise posting URLs and warn on potential duplicates before a new record is created. |
| JOB-004 | P0 | Edit posting fields supported by the domain service. |
| JOB-005 | P0 | Mark posting as High, Medium, Low, or untriaged. |
| JOB-006 | P0 | Change `triage_rank` atomically within a priority tier. |
| JOB-007 | P0 | Show source, salary, closing date, networking state, application state, and relevant documents. |
| JOB-008 | P0 | Closing a posting shall not delete its historical application or attribution data. |
| JOB-009 | P1 | Provide a focused quick-triage mode showing no more than ten roles at a time. |
| JOB-010 | P1 | Allow multi-select priority assignment with a confirmation summary. |
| JOB-011 | P1 | Open external posting URLs through a validated HTTPS allowlist function. |

### 10.4 Applications and pipeline

| ID | Priority | Requirement |
|---|---|---|
| APP-001 | P0 | Display applications grouped by lifecycle status. |
| APP-002 | P0 | Support the statuses `draft`, `ready`, `applied`, `screening`, `interviewing`, `offer`, `accepted`, `rejected`, and `withdrawn`. |
| APP-003 | P0 | Validate status transitions through a central domain service, not renderer logic. |
| APP-004 | P0 | Creating an application shall always reference an existing posting. |
| APP-005 | P0 | A saved posting shall not automatically create an application. |
| APP-006 | P0 | Show applied date, response date, linked documents, referral, notes, and latest activity. |
| APP-007 | P0 | Record status, document, review, gate override, and submission changes in attribution history. |
| APP-008 | P0 | Deleting an unsubmitted application shall preserve the posting. |
| APP-009 | P1 | Permit drag-and-drop status changes only when the target transition is valid; otherwise explain the required intermediate step. |
| APP-010 | P1 | Provide stale follow-up indicators based on configurable intervals. |

### 10.5 Contacts and networking

| ID | Priority | Requirement |
|---|---|---|
| NET-001 | P0 | List contacts and their linked companies/postings. |
| NET-002 | P0 | Create, edit, link, unlink, and delete contacts through domain services. |
| NET-003 | P0 | Support the existing relationship types and networking statuses. |
| NET-004 | P0 | Show networking readiness on every applicable job and application surface. |
| NET-005 | P0 | Never send an outreach message automatically in the MVP. |
| NET-006 | P1 | Allow users to record sent date, channel, response, and next follow-up. |
| NET-007 | P1 | Generate outreach drafts grounded in the selected contact and role context. |

### 10.6 Interviews

| ID | Priority | Requirement |
|---|---|---|
| INT-001 | P0 | List upcoming and historical interviews ordered by time. |
| INT-002 | P0 | Schedule and edit interview type, time, duration, interviewer, status, notes, feedback, and rating. |
| INT-003 | P0 | Link every interview to an application. |
| INT-004 | P0 | Display timezone explicitly and store timestamps in UTC. |
| INT-005 | P1 | Show preparation completeness and one-click access to a prep workflow. |
| INT-006 | P1 | Trigger local reminders based on user preferences. |

### 10.7 Documents and local workspace

| ID | Priority | Requirement |
|---|---|---|
| DOC-001 | P0 | User shall explicitly choose one local workspace directory. |
| DOC-002 | P0 | Filesystem access shall be restricted to the approved workspace and app-owned directories. |
| DOC-003 | P0 | Show master files and job-specific files with type, path, modification time, and associated posting/application. |
| DOC-004 | P0 | Generated files shall be written atomically using a temporary file and rename strategy. |
| DOC-005 | P0 | The app shall not overwrite a source document without an explicit user-approved operation. |
| DOC-006 | P0 | Passing review freshness shall be invalidated when a reviewed file modification time or content hash changes. |
| DOC-007 | P0 | Path values displayed in the renderer shall be normalised and must not permit traversal outside the workspace. |
| DOC-008 | P1 | Provide OS-native reveal, open, duplicate, and export actions through validated main-process commands. |
| DOC-009 | P1 | Show document generation and validation warnings without exposing hidden model reasoning. |

### 10.8 AI workflows

| ID | Priority | Requirement |
|---|---|---|
| AI-001 | P0 | Run Claude Agent SDK calls in an isolated worker process, never in the renderer. |
| AI-002 | P0 | Each workflow shall define its system instructions, allowed tools, denied tools, workspace, model policy, and approval policy. |
| AI-003 | P0 | Stream user-understandable lifecycle events: queued, preparing, reading, researching, drafting, validating, awaiting approval, completed, failed, or cancelled. |
| AI-004 | P0 | Persist run identity, workflow type, entity association, timestamps, outcome, cost metadata where available, and error summary. |
| AI-005 | P0 | Provide a cancel operation that stops the worker and reports whether any writes already occurred. |
| AI-006 | P0 | User input requests shall pause the run and be resumable after app restart when the SDK supports it. |
| AI-007 | P0 | Tool approvals shall identify the requested action, target, reason, and consequence. |
| AI-008 | P0 | Generated claims shall remain grounded in master career files; workflows must not invent experience or metrics. |
| AI-009 | P0 | Agent output shown in the UI shall exclude hidden chain-of-thought content. |
| AI-010 | P1 | Allow per-workflow model selection within an administrator-defined allowlist. |
| AI-011 | P1 | Track token/cost estimates locally and expose optional budgets. |
| AI-012 | P1 | Support resuming previous coach sessions associated with a workspace. |

### 10.9 Application browser assistant

| ID | Priority | Requirement |
|---|---|---|
| BRW-001 | P0 | Run Playwright in an isolated worker with a visible browser. |
| BRW-002 | P0 | Use a separate browser profile or context dedicated to the application assistant. |
| BRW-003 | P0 | Read ATS credentials through a narrow Keychain broker that never returns secret text to the renderer. |
| BRW-004 | P0 | Enforce networking and pre-submission review gates before browser launch. |
| BRW-005 | P0 | Overrides shall require explicit selection, a non-empty reason, and final confirmation. |
| BRW-006 | P0 | Pause after filling every page and before every navigation that could submit data. |
| BRW-007 | P0 | Final submission shall require an approval token scoped to the application ID and current browser page state. |
| BRW-008 | P0 | Approval tokens shall expire after use, navigation, meaningful DOM change, or a short timeout. |
| BRW-009 | P0 | Upload only files explicitly linked to the selected application. |
| BRW-010 | P0 | Record submission confirmation evidence without storing unnecessary sensitive page content. |
| BRW-011 | P1 | Detect supported ATS families and load specific guidance. |
| BRW-012 | P1 | Offer manual takeover at any point without losing workflow state. |

### 10.10 Activity, attribution, and diagnostics

| ID | Priority | Requirement |
|---|---|---|
| ACT-001 | P0 | Every material mutation shall include actor and reason metadata. |
| ACT-002 | P0 | Activity shall be filterable by entity, actor, action, date, and outcome. |
| ACT-003 | P0 | Agent and automation errors shall include a safe user-facing summary and correlation ID. |
| ACT-004 | P0 | Logs shall redact API keys, tokens, passwords, cookies, form values marked sensitive, and document contents unless explicitly required for debugging. |
| ACT-005 | P1 | Users shall be able to export a redacted diagnostic bundle after previewing its contents. |

### 10.11 Settings and onboarding

| ID | Priority | Requirement |
|---|---|---|
| SET-001 | P0 | Onboarding shall configure local workspace, Supabase/MCP connection, AI provider, and credential-store availability. |
| SET-002 | P0 | Secret values shall be entered into a privileged native surface or secure main-process flow, not ordinary persisted renderer state. |
| SET-003 | P0 | Settings shall test each integration independently and report actionable errors. |
| SET-004 | P0 | The app shall support disconnecting integrations and clearing local session/cache data. |
| SET-005 | P1 | Users shall configure notification times, weekly targets, stale follow-up intervals, and default workflow models. |

---

## 11. Screen specifications

### 11.1 Overview

**Purpose:** answer “What should I do next?”

**Required regions:**

- Greeting and sync freshness.
- Four compact metrics: active roles, applications, interviews, weekly target.
- Priority queue ordered by priority and rank.
- Applications needing attention.
- Compact application funnel.
- AI Coach recommendation with explanation and next-step actions.

**States:** loading skeleton, populated, no active jobs, disconnected/cached, partial error.

**Primary actions:** open job, start recommended workflow, quick triage, add job, open pipeline.

### 11.2 Pipeline

**Purpose:** make application movement and bottlenecks visible.

**Columns:** Preparing, Ready, Applied, Screening, Interviewing, Offer. Rejected, Withdrawn, Accepted are available through filters or completed views.

**Card content:** company, role, priority, latest milestone, age/staleness, next action, blocker indicator.

**Interaction:** selecting a card opens the application drawer. Dragging requests a validated transition and does not optimistically commit until the domain service succeeds.

### 11.3 Jobs

**Purpose:** compare, triage, rank, and act on opportunities.

**Default columns:** role/company, priority/rank, source, networking state, application state, closing date.

**Filters:** untriaged, priority, source, status, has application, networking status, closing soon.

**Quick triage mode:** one role at a time on small windows or up to five comparable rows on larger windows; keyboard shortcuts H/M/L; user can defer without losing position.

### 11.4 Job/application detail

**Header:** company, role, location/work policy, salary, priority/rank, source, posting link.

**Readiness track:** triage, contact research, outreach, tailored resume, cover letter if needed, pre-submission review, ready to apply.

**Actions:** start/continue next workflow, edit details, open posting, close role, begin application, view activity.

**Blocked action treatment:** do not merely disable. Explain the blocker and offer the correct next action. An override is only presented where policy permits.

### 11.5 AI task surface

**Required elements:**

- Workflow and associated job/application.
- Current lifecycle stage.
- Concise event stream.
- Elapsed time and optional cost indicator.
- Cancel button.
- Approval/user-input panel when paused.
- Generated files and validation outcome on completion.
- Retry and diagnostics on failure.

### 11.6 Browser application surface

The browser itself remains a separate visible window. The app displays a companion control panel containing:

- Current job/application.
- Detected ATS and page step.
- Fields completed and fields needing user input.
- Files selected for upload.
- Gate status and any override.
- “Review in browser,” “Continue,” “Take over manually,” “Cancel,” and final “Confirm submission” actions.

---

## 12. Domain model and state machines

### 12.1 Existing primary entities

- `companies`
- `job_postings`
- `applications`
- `interviews`
- `job_contacts`
- `posting_contacts`
- `daily_stats`
- `attribution_log`

### 12.2 Recommended new entities

#### `agent_runs`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Required in multi-user mode |
| `workflow` | TEXT | coach, resume, cover_letter, review, outreach, prep, browser_apply |
| `entity_type` | TEXT | posting, application, interview, workspace |
| `entity_id` | UUID nullable | Associated entity |
| `status` | TEXT | queued, running, waiting, completed, failed, cancelled |
| `session_id` | TEXT nullable | Provider/SDK resume identifier |
| `started_at` | TIMESTAMPTZ | |
| `finished_at` | TIMESTAMPTZ nullable | |
| `error_code` | TEXT nullable | Safe classification |
| `error_summary` | TEXT nullable | Redacted user-facing detail |
| `usage` | JSONB nullable | Token/cost metadata without secrets |
| `created_at` | TIMESTAMPTZ | |

#### `agent_run_events`

Append-only lifecycle events with run ID, sequence number, event type, safe payload, and timestamp. Hidden model reasoning must never be stored.

#### `document_assets`

Stores logical document type, application/posting association, workspace-relative path, content hash, modification time, created-by run, and validation state.

#### `application_reviews`

Stores application ID, result, review time, reviewed asset hashes, structured finding counts, safe summary, and reviewer run ID. This is preferable to parsing unstructured application notes.

#### `gate_overrides`

Stores application ID, gate type, user ID, reason, acknowledged consequence, timestamp, and related browser run. This makes override auditing explicit.

### 12.3 Application state machine

```text
draft → ready → applied → screening → interviewing → offer → accepted
   │       │        │          │             │          └→ rejected
   └───────┴────────┴──────────┴─────────────┴───────────→ withdrawn
```

Rules:

- `draft` may be used while documents are incomplete.
- `ready` means preparation is complete enough to apply, not that gates have necessarily passed.
- `applied` requires an applied date.
- `screening`, `interviewing`, and `offer` should not be entered before `applied` unless the system records an imported historical application.
- `accepted`, `rejected`, and `withdrawn` are terminal for normal UI transitions.
- Administrative correction can reopen a terminal record only through an explicit audited operation.

### 12.4 Readiness evaluation

Readiness is calculated, not manually stored as one mutable boolean.

```text
triaged
AND required resume exists
AND networking_status ∈ {outreach_in_progress, done}
AND latest review = PASS
AND reviewed asset hashes = current asset hashes
AND posting is active
```

Cover letter is required only when the posting, workflow, or application form requires it.

### 12.5 Agent run state machine

```text
queued → running → waiting_for_input → running → completed
                ├→ waiting_for_approval → running
                ├→ failed
                └→ cancelled
```

Each transition must be append-only in `agent_run_events`; the current state may also be materialised on `agent_runs` for efficient queries.

---

## 13. Production architecture

### 13.1 Process boundaries

```text
React renderer
  │ typed, allowlisted IPC
  ▼
Electron main process
  ├── Domain client / MCP adapter
  ├── Workspace file broker
  ├── Credential broker
  ├── Notification service
  ├── Agent worker process
  └── Playwright worker process
          │
          ▼
Supabase Edge Function / MCP → PostgreSQL
```

### 13.2 Renderer

Responsibilities:

- Present application state.
- Maintain ephemeral UI state.
- Validate user input for usability, while treating main-process/domain validation as authoritative.
- Request operations through typed IPC.
- Display task progress and approval prompts.

The renderer must not:

- Read environment variables.
- Receive or store secret keys.
- Execute shell commands.
- Access arbitrary filesystem paths.
- Instantiate Playwright or an AI SDK.
- Connect with a Supabase service-role key.
- Render untrusted remote pages with privileged Node access.

### 13.3 Electron main process

Responsibilities:

- Window lifecycle and secure web preferences.
- Validate IPC sender, channel, schema, permissions, and target.
- Coordinate domain operations.
- Broker file and credential access.
- Start, monitor, and stop worker processes.
- Manage deep links, native dialogs, menus, notifications, and app updates.
- Store non-secret settings and encrypted session material using appropriate OS facilities.

Required Electron settings:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true` where compatible
- restrictive Content Security Policy
- no unrestricted `shell.openExternal`
- no renderer-controlled path passed directly to privileged APIs
- validate every IPC sender and payload
- disable unexpected navigation and window creation

### 13.4 Preload bridge

Expose a narrow API grouped by capability. Example:

```ts
type DesktopBridge = {
  pipeline: {
    getOverview(): Promise<PipelineOverview>;
    searchJobs(input: SearchJobsInput): Promise<JobSearchResult>;
    updateJob(input: UpdateJobInput): Promise<JobPosting>;
    transitionApplication(input: TransitionApplicationInput): Promise<Application>;
  };
  tasks: {
    start(input: StartTaskInput): Promise<TaskHandle>;
    cancel(runId: string): Promise<CancelResult>;
    approve(input: TaskApprovalInput): Promise<void>;
    subscribe(listener: (event: TaskEvent) => void): Unsubscribe;
  };
  workspace: {
    choose(): Promise<WorkspaceSummary | null>;
    listDocuments(input: ListDocumentsInput): Promise<DocumentAsset[]>;
    open(assetId: string): Promise<void>;
    reveal(assetId: string): Promise<void>;
  };
};
```

No generic `invoke(command, args)`, `runShell`, `readFile(path)`, or `getSecret(name)` method may be exposed.

### 13.5 Domain layer

Extract domain operations currently embedded in MCP registrations into reusable, testable services where practical:

```text
packages/
  contracts/
    entities.ts
    inputs.ts
    events.ts
    errors.ts
  core/
    companies.ts
    postings.ts
    applications.ts
    interviews.ts
    contacts.ts
    ranking.ts
    readiness.ts
    attribution.ts
  mcp-client/
  agent-runtime/
```

The MCP server and desktop backend should call the same domain services or enforce the same contract tests. If Edge Function constraints make direct code sharing impractical, publish contract fixtures and invariant tests that run against both adapters.

### 13.6 Data-access strategy

Two modes are possible:

#### Personal compatibility mode

- Desktop main process stores the MCP access key in Keychain.
- Renderer calls main process; main process calls the existing MCP endpoint with a header.
- Service-role key remains only in the Edge Function environment.
- Appropriate for a single trusted user during early development.

#### Authenticated production mode

- User signs in through Supabase Auth.
- Desktop app receives a user session and sends the JWT to an authenticated backend.
- Backend creates a request-scoped Supabase client and enforces `user_id`.
- RLS policies protect every table, including junction, statistics, and attribution tables.
- Shared static MCP keys are removed from distributed clients.

The distributable product must use authenticated production mode before general release.

---

## 14. MCP and service contract strategy

### 14.1 Existing operation mapping

The desktop domain adapter should initially map to existing MCP tools:

| Desktop operation | MCP capability |
|---|---|
| Add company | `add_company` |
| Add/upsert posting | `add_job_posting` |
| Edit posting and triage | `update_job_posting` |
| Remove posting | `delete_job_posting` |
| Search/filter postings | `search_job_postings` |
| Create application | `submit_application` |
| Edit/status application | `update_application` |
| Remove application | `delete_application` |
| Pipeline dashboard | `get_pipeline_overview` |
| Schedule interview | `schedule_interview` |
| Interview notes | `log_interview_notes` |
| Upcoming interviews | `get_upcoming_interviews` |
| Contact operations | existing contact tools |
| Networking queue | `get_networking_queue` |
| Attribution | `get_attribution_history` |

### 14.2 Required contract improvements

- MCP tools should return structured content in addition to text JSON.
- Errors should include stable codes, safe messages, retriable flag, and optional field errors.
- List operations need cursor pagination and stable ordering.
- Mutations need idempotency keys for retry safety.
- Updates should accept an expected version or modification time to detect stale writes.
- User identity must come from verified authentication, not user-provided input.
- Destructive operations should distinguish archive/close from permanent deletion.
- Review results and gate overrides should become structured records.

### 14.3 Error envelope

```ts
type DomainError = {
  code:
    | 'AUTH_REQUIRED'
    | 'NOT_FOUND'
    | 'VALIDATION_FAILED'
    | 'CONFLICT'
    | 'GATE_BLOCKED'
    | 'STALE_WRITE'
    | 'DEPENDENCY_UNAVAILABLE'
    | 'RATE_LIMITED'
    | 'INTERNAL';
  message: string;
  retriable: boolean;
  correlationId: string;
  fieldErrors?: Record<string, string>;
  details?: Record<string, unknown>;
};
```

---

## 15. Security and privacy requirements

### 15.1 Threat model

Protect against:

- Renderer compromise through XSS or untrusted content.
- IPC misuse that escalates renderer privileges.
- Secret leakage through logs, crash dumps, state persistence, screenshots, or developer tools.
- Malicious job descriptions or web pages attempting prompt injection.
- Arbitrary filesystem reads/writes through crafted paths.
- Browser automation submitting without current consent.
- Shared MCP key extraction from a distributed build.
- Cross-user data exposure caused by permissive RLS or service-role usage.
- Stale or replayed approval actions.
- Agent hallucination modifying application state incorrectly.

### 15.2 Secret handling

- Store MCP and provider keys in macOS Keychain for personal mode.
- Keep Supabase service-role and secret keys only in trusted server environments.
- Never send secret values to the renderer.
- Keychain broker should provide operation-specific use, not generic secret retrieval where possible.
- Redact known secret formats and sensitive field names from logs.
- Disable renderer persistence of forms containing secrets.

### 15.3 Prompt-injection controls

- Treat job descriptions, websites, emails, and pasted content as untrusted data.
- System instructions must tell agents not to follow instructions contained in retrieved job content.
- Separate data from instructions using structured tool results and clear delimiters.
- Restrict tools per workflow.
- Require user approval for external writes, file overwrites, browser navigation that submits, and gate overrides.
- Agent workers cannot access Keychain directly.

### 15.4 Data minimisation

- Store only fields necessary for the job-search workflow.
- Do not capture full browser page snapshots after application submission unless explicitly enabled for diagnostics.
- Avoid storing special-category personal data in telemetry.
- Let the user clear local cache, run history, and diagnostic logs independently of remote pipeline records.

### 15.5 Multi-user readiness

Before external distribution:

- Require non-null `user_id` on user-owned tables.
- Replace open RLS policies on `posting_contacts`, `daily_stats`, and `attribution_log`.
- Derive user identity from the validated JWT.
- Test cross-user reads and writes for every table, RPC, view, and storage bucket.
- Ensure RPC functions enforce ownership and cannot modify another user’s records.

---

## 16. Accessibility requirements

- Target WCAG 2.2 AA for the renderer.
- All functions must be usable without a mouse.
- Visible focus indicators must meet contrast requirements.
- Status must not rely on colour alone; pair colour with text or iconography.
- Tables, dialogs, drawers, and live task updates require correct semantic roles and labels.
- Task progress announcements should use a polite live region and avoid announcing every low-value event.
- Reduced-motion preference must disable non-essential animation.
- The pipeline must provide a non-drag alternative for status transitions and reordering.
- Minimum target size should be 24×24 CSS pixels, with 36×36 preferred for primary controls.
- Support 200% zoom without losing actions or requiring two-dimensional scrolling in standard views.

---

## 17. Performance, resilience, and offline behaviour

### 17.1 Performance budgets

- JavaScript loaded by the renderer: target under 800 KB compressed for MVP shell, excluding lazily loaded document/browser modules.
- Overview cached render: under 1 second after renderer bootstrap.
- Common navigation transition: under 100 ms perceived latency.
- Search feedback: under 150 ms for local filtering; remote search debounced.
- Long lists must use pagination or virtualisation beyond 200 visible records.

### 17.2 Caching

- Store a local, encrypted or OS-protected cache of non-secret pipeline summaries.
- Cache is read-only when offline.
- Pending writes should not be silently queued in MVP; retain the user’s unsaved form and clearly require retry when online.
- Show data freshness on cached screens.

### 17.3 Concurrency

- Use optimistic concurrency for mutable records.
- If CLI changes a record while the GUI editor is open, reject a stale save and present a field-level comparison.
- Real-time subscriptions may invalidate queries but must not overwrite unsaved local input.

### 17.4 Recovery

- Agent run records and events persist outside worker memory.
- On restart, active runs are reconciled as running, resumable, failed, or interrupted.
- Atomic file writes prevent partially written documents.
- Compound database/filesystem operations use a recovery record when a true distributed transaction is impossible.

---

## 18. Observability and analytics

### 18.1 Product events

Optional consented events:

- app_opened
- overview_action_started
- quick_triage_started/completed
- workflow_started/completed/failed/cancelled
- approval_requested/approved/denied
- gate_blocked/overridden
- application_status_changed
- interview_prep_started/completed

Do not include document content, contact details, job application form answers, secrets, or full URLs containing query parameters.

### 18.2 Operational telemetry

- Crash reporting must be opt-in or clearly disclosed.
- Correlation IDs connect renderer errors, main-process errors, worker errors, and server errors.
- Local logs rotate and expire automatically.
- Diagnostic export is redacted and previewable.

---

## 19. Testing strategy

### 19.1 Unit tests

- URL normalisation and duplicate detection.
- Status transition validation.
- Atomic triage ranking behaviour.
- Readiness calculation.
- Review freshness from hashes/mtime.
- Gate override validation.
- Path containment and traversal rejection.
- Log redaction.
- IPC schema validation.

### 19.2 Contract tests

- Desktop adapter against MCP tool schemas.
- Structured response parsing.
- Stable domain error mapping.
- Idempotent mutation retry.
- User ownership enforcement.

### 19.3 Integration tests

- Add posting → triage → create draft application.
- Resume run → generated asset → application record update.
- File edit after review → readiness becomes stale.
- Networking blocked → override → audited continuation.
- CLI mutation while GUI open → stale-write conflict.
- Interrupted agent worker → recoverable run state.
- Playwright final-submit approval token invalidation.

### 19.4 End-to-end tests

- First-run onboarding with a test Supabase project.
- Daily overview with representative records.
- Quick triage by keyboard.
- Valid and invalid application status movement.
- Resume workflow approval and cancellation.
- Browser assistant against local fixture pages representing common ATS patterns.
- Offline launch and reconnection.
- App update and database migration compatibility.

### 19.5 Security tests

- Renderer cannot access Node primitives or environment variables.
- Untrusted HTML cannot invoke privileged IPC.
- Invalid IPC sender is rejected.
- Arbitrary paths and symlink escapes are rejected.
- Secrets absent from renderer heap snapshots and persisted state.
- Cross-user RLS and RPC penetration tests.
- Prompt-injection fixture cannot broaden agent tools or bypass approvals.
- Final browser submission cannot be replayed.

### 19.6 Accessibility tests

- Automated axe checks on every primary route.
- Keyboard-only smoke tests.
- VoiceOver task walkthrough on macOS.
- 200% zoom and reduced motion.
- High contrast and colour-blind status comprehension.

---

## 20. Rollout and migration

### 20.1 Development stages

1. **Prototype review:** validate information architecture and visual hierarchy.
2. **Read-only alpha:** Electron shell reads pipeline and local workspace without mutations.
3. **Pipeline beta:** safe CRUD, triage, status changes, activity, and conflicts.
4. **Agent beta:** coach and document workflows with progress and approvals.
5. **Application-assistant beta:** Playwright worker with fixture ATS sites, then limited real-world testing.
6. **Signed personal release:** notarised macOS build for the initial user.
7. **Authenticated release:** Supabase Auth, hardened RLS, installer/update channel, and broader distribution.

### 20.2 Database migration approach

- All schema changes are forward-only migrations committed to the repository.
- Migrations must be safe with existing CLI agents and MCP tools.
- New structured review/override tables may coexist with legacy notes during transition.
- A one-time migration can parse recognised legacy review lines into structured records, retaining original notes.
- Desktop checks server capability/version before enabling features that require new schema or tools.

### 20.3 Feature flags

Recommended flags:

- `desktop_pipeline_writes`
- `agent_runtime`
- `document_generation`
- `browser_assistant`
- `gate_overrides`
- `supabase_realtime`
- `authenticated_multi_user`

---

## 21. Implementation work breakdown

### Epic A — Contracts and shared domain rules

- Define TypeScript entity and input schemas.
- Extract status transitions and readiness calculation.
- Add stable error envelope.
- Add idempotency and concurrency strategy.
- Create MCP adapter contract tests.

### Epic B — Secure Electron foundation

- Scaffold Electron, React, TypeScript, and packaging.
- Configure secure BrowserWindow defaults and CSP.
- Implement typed preload bridge.
- Add IPC sender and payload validation.
- Add logging, correlation IDs, and redaction.

### Epic C — Pipeline interface

- Overview queries and cache.
- Jobs table, search, filters, add/edit form.
- Quick triage and rank operations.
- Pipeline board and validated transitions.
- Job/application drawer.
- Interviews, contacts, and activity views.

### Epic D — Workspace and document services

- Workspace picker and persisted permission.
- Safe workspace-relative path model.
- Document indexing and content hashes.
- Atomic generation output.
- OS open/reveal operations.
- Review freshness evaluation.

### Epic E — Agent runtime

- Claude Agent SDK worker wrapper.
- Workflow registry from existing agent instructions.
- Tool allow/deny policies.
- Event streaming and persistence.
- Approval/input protocol.
- Cancellation, restart reconciliation, and diagnostics.

### Epic F — Browser assistant

- Dedicated Playwright worker and browser profile.
- Keychain credential broker.
- Gate evaluator and structured overrides.
- Page-step protocol and user review loop.
- Scoped final-submit approvals.
- Local ATS fixtures and supported-site tests.

### Epic G — Onboarding and distribution

- Integration setup wizard.
- Connection diagnostics.
- Local notification preferences.
- macOS signing/notarisation.
- Auto-update channel with rollback strategy.
- Privacy notice and diagnostic export.

---

## 22. Milestone estimate

Estimate assumes one experienced full-time engineer with design/product support and no major Supabase migration blockers.

| Milestone | Duration | Output |
|---|---:|---|
| Product prototype and PRD review | 1 week | Approved flows and scope |
| Architecture/contracts | 1–2 weeks | Domain contracts, Electron foundation |
| Read-only desktop alpha | 1–2 weeks | Dashboard, jobs, pipeline, details |
| Pipeline write beta | 2 weeks | CRUD, triage, transitions, activity |
| Workspace/documents | 1–2 weeks | Safe file broker and document UI |
| Agent workflows | 2–3 weeks | Coach, resume, letter, review, outreach |
| Browser assistant | 2–4 weeks | Safe visible form assistance |
| Hardening and release | 1–2 weeks | Tests, accessibility, signing, recovery |

Expected total: approximately 10–16 engineering weeks for a polished personal macOS release. A useful read-only/pipeline alpha should be achievable in 3–5 weeks.

---

## 23. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| MCP business logic diverges from desktop logic | Inconsistent state | Shared core or mandatory contract/invariant tests |
| Service/MCP key extracted from distributed app | Full data exposure | Supabase Auth and JWT-backed server before broad distribution |
| Browser automation breaks as ATS sites change | Failed applications | Supported-site fixtures, manual takeover, never auto-submit |
| Agent acts on malicious job-page instructions | Data or privilege loss | Treat content as data, tool isolation, approvals, no direct secrets |
| Local files moved or renamed outside the app | Stale document links | Workspace index, asset hashes, repair flow |
| CLI and GUI edit concurrently | Lost changes | Optimistic concurrency and conflict UI |
| Review status stored in unstructured notes | Fragile gate | Add structured `application_reviews` table |
| Electron renderer compromise | Native privilege escalation | Context isolation, sandbox, CSP, typed minimal IPC |
| API costs surprise the user | Trust loss | Usage display, budgets, workflow estimates, confirmation for expensive runs |
| Application gate frustrates urgent use | Unsafe workarounds | Explain blocker, provide next action, allow explicit audited override |

---

## 24. Definition of done for MVP

The MVP is complete when:

- A user can install and launch a signed macOS app.
- Onboarding validates Supabase/MCP, local workspace, AI provider, and credential-store access.
- Overview, Jobs, Pipeline, Applications, Interviews, Contacts, Documents, Activity, and Settings use real data.
- A user can add, edit, triage, rank, close, and search postings safely.
- A user can create and progress an application through valid statuses.
- CLI changes appear in the GUI without data corruption.
- Resume, cover-letter, review, outreach, and interview-prep workflows run through isolated agent workers.
- Task progress, approval, cancellation, failure, and generated files are visible.
- Review freshness and networking gates are calculated correctly.
- Browser assistance pauses per page and requires a current scoped final-submit confirmation.
- Secrets cannot be retrieved from renderer code or persisted renderer storage.
- All material mutations have attribution history.
- P0 unit, integration, end-to-end, security, and accessibility tests pass.
- Crash recovery and offline cached-read behaviour are tested.
- Documentation covers setup, backup, recovery, privacy, and disabling integrations.

---

## 25. Prototype review checklist

Reviewers should use `desktop-prototype/` to answer:

1. Can the user identify the top next action immediately?
2. Are Jobs and Applications clearly distinct?
3. Does the readiness track make blockers understandable?
4. Is the pipeline board useful without becoming a generic CRM?
5. Are AI actions named by desired outcome rather than internal agent name?
6. Is important detail available without overwhelming the overview?
7. Do the add-job, job-detail, coach, search, and navigation interactions feel predictable?
8. Which information is unnecessary or missing before production implementation?

Prototype feedback should be resolved before high-cost agent and browser integration begins.

---

## 26. Default decisions requiring confirmation before production

These defaults allow implementation to begin without blocking the prototype. Product ownership should confirm them before production beta:

1. Initial release is macOS-only and personal/single-user.
2. Production UI uses Electron + React + TypeScript.
3. Existing Supabase remains the canonical data store.
4. Existing MCP remains the initial desktop data adapter.
5. Claude Agent SDK powers production AI workflows.
6. Users provide their own supported API credentials.
7. The app never submits an application without explicit final confirmation.
8. Outreach is drafted but not automatically sent in MVP.
9. Browser automation uses a dedicated visible profile/context.
10. CLI remains supported throughout migration.

