# AI Job Hunt Toolkit

An AI-powered job hunting pipeline built on [Claude Code](https://claude.com/claude-code), Supabase, and macOS scheduled automations. Manages the entire job search lifecycle: resume optimization, cover letter writing, application form filling, LinkedIn outreach, contact networking, career coaching, and daily accountability tracking.

## How It Works

```
                    +-----------------+
                    |   Claude Code   |
                    |   (11 agents)   |
                    +--------+--------+
                             |
                    +--------v--------+
                    |   MCP Server    |
                    |  (Supabase Edge |
                    |   Function)     |
                    +--------+--------+
                             |
                    +--------v--------+
                    |    Supabase     |
                    |   PostgreSQL    |
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v---+  +------v------+  +----v--------+
     |  Scheduled  |  |   Slack     |  |   Gmail     |
     | Automations |  |   Alerts    |  |   Alerts    |
     | (launchd)   |  |             |  |             |
     +-------------+  +-------------+  +-------------+
```

**Agents** are Claude Code agent definitions that specialize in different tasks. They talk to a **Supabase MCP server** that provides tools for managing companies, job postings, applications, interviews, and contacts. **Scheduled automations** run via macOS launchd to enrich job postings, send daily status notifications, and maintain data quality.

## Components

### Agents (`agents/`)

Eleven specialized Claude Code agents, each with deep domain instructions:

| Agent | Purpose |
|-------|---------|
| **job-coach** | Entry point: career coaching, pipeline triage, execution workflow |
| **job-finder-indeed** | Search Indeed API for matching jobs; add to pipeline (daily or on-demand) |
| **job-finder-linkedin** | Search LinkedIn Jobs API for matching jobs; add to pipeline (daily or on-demand) |
| **job-finder-adzuna** | Search Adzuna API across UK job boards (Reed, TotalJobs, Guardian Jobs, CV-Library and more); add to pipeline |
| **resume-optimizer** | Creates tailored resumes from job postings using a master bullet library |
| **cover-letter-optimizer** | 4-phase pipeline: Briefing, Story Matching, Outline, Draft |
| **application-reviewer** | Read-only, adversarial pre-submission review of the resume + cover letter package from a sceptical recruiter's perspective |
| **job-applicator** | Fills out application forms via Playwright; supports Indeed Easy Apply & LinkedIn Apply |
| **linkedin-outreach** | Drafts personalized LinkedIn messages using 9 relationship-based templates |
| **contact-discovery** | Guides batch contact research sessions with LinkedIn |
| **setup-assistant** | Infrastructure setup: Supabase, MCP server, credentials, notifications |

### Job Discovery Workflow

**Job discovery** from Indeed, LinkedIn, and Adzuna APIs replaces manual browsing:

```
job-finder-indeed + job-finder-linkedin + job-finder-adzuna search APIs
    ↓
New jobs added to Supabase (source=indeed / source=linkedin / source=adzuna)
    ↓
Session Start
    ↓
job-coach detects untriaged jobs
    ↓
Bulk triage: High/Medium/Low priority (5 min)
    ↓
Execution workflow: Resume → Cover Letter → Pre-Submission Review → Apply
```

**Two discovery modes**:
- **On-Demand** (fully working today): Ask job-coach "Search Indeed/LinkedIn/Adzuna for [role] in [city]" anytime
- **Daily Scheduled** (config format exists, launchd wiring not yet built): `.job-discovery-config.example.yaml` at the repo root defines the target searches and schedule for a future `daily-job-discovery.ts` runner. Until that script exists, treat the config as documentation of intent and drive discovery on-demand instead.

**Key benefits**:
- Official APIs only (no ToS violations, unlike LinkedIn scraping)
- 3-5x more job candidates per week — Adzuna adds UK board-specific listings missed by Indeed and LinkedIn
- Full deduplication across all sources

**Setup**: During `setup-assistant`, configure Indeed API key, LinkedIn OAuth, and Adzuna credentials (free at https://developer.adzuna.com/), then copy `.job-discovery-config.example.yaml` to `~/job-hunt/.job-discovery-config.yaml` and fill in your target searches.

### Application Gates

`job-applicator` enforces two independent, mandatory gates before it will open a browser to submit anything. Both check the database directly regardless of what the coach believes the current state to be, and both can be overridden by typing SKIP — never silently; the override and its reason are always logged on the application record.

1. **Networking gate** — blocks until contact research and outreach have at least started for the role. Applying cold, with zero prior contact, measurably performs worse than applying with any networking effort behind it.
2. **Pre-submission review gate** — blocks until the `application-reviewer` agent has logged a passing review dated *after* the resume and cover letter were last modified. A review that passed before the most recent edit doesn't count, since edits introduce new errors as often as they fix old ones.

`application-reviewer` itself is read-only: it never touches the documents. It extracts the actual file content (paragraphs, tables, headers/footers, metadata, tracked changes — not a summary from whichever agent built the file), cross-checks every claim against your master files, maps the job description's requirements line by line, and returns findings in three tiers — Must-fix (blocks submission), Interview-prep (a gap worth having an answer ready for), and Minor. Must-fix findings route back to `resume-optimizer` or `cover-letter-optimizer` to fix; the reviewer re-checks after.

Full step-by-step sequencing lives in `coach-tools/execution-workflow.md`, which `job-coach` uses to derive "what's next" from database state. The two gates above are a second, independent safety net on top of that — so a request to apply directly, bypassing the coach, still can't skip networking or a passing review without an explicit, logged SKIP.

### MCP Server (`mcp-server/`)

A Supabase Edge Function that exposes job pipeline tools via the Model Context Protocol. Agents use these tools to:

- Track companies, postings, and applications
- Manage contacts and networking status
- Schedule and log interviews
- Maintain an attribution log (who/what created or changed each record)
- Stack-rank postings within priority tiers

#### Desktop MCP contract

The separate `ai_job_hunt_desktop_app` repository uses this MCP server as its
only database boundary. Migration
`supabase/migrations/202608130001_desktop_mvp.sql` adds the personal desktop
records, optimistic-concurrency timestamps, one-application-per-posting
constraint, exact document hashes, independent reviews, explicit gate
overrides, run events, and idempotency storage without renaming legacy fields.

Both the local MCP entrypoint and Supabase Edge Function register the shared
desktop handlers in `supabase/functions/_shared/`. Existing tool names and
arguments remain available; desktop-aware responses additionally return a
versioned `structuredContent` envelope. Apply the migration before deploying
the function, then deploy it in custom-header authentication mode:

```bash
supabase functions deploy job-hunt-mcp --no-verify-jwt --project-ref <ref>
```

This disables the Supabase gateway JWT check for this function because the
desktop and CLI authenticate with `x-brain-key` instead. It does not make the
function unauthenticated: the function rejects missing or invalid keys with a
typed `AUTH_REQUIRED` response. Never put an MCP key in a URL. After deploying,
verify `get_desktop_capabilities` reports contract `1.3.0`.

### Scheduled Automations (`extension/`)

Deno scripts triggered by macOS launchd on a schedule:

| Script | Schedule | Purpose |
|--------|----------|---------|
| `daily-status.ts --mode daily` | Daily | Pipeline summary: last 7 days activity and next steps |
| `daily-status.ts --mode weekly-summary` | Sunday 10am | Weekly application summary email |
| `enrich-job-postings.ts` | 10am daily | Scrape LinkedIn for missing job details (opt-in, see warning below) |
| `posting-maintenance.ts` | Sunday 7am | Check active postings for expiration (opt-in, see warning below) |

A scheduled `daily-job-discovery.ts` runner (to automate the Indeed/LinkedIn/Adzuna searches described above) is not implemented yet — see [CHANGELOG.md](CHANGELOG.md) and use on-demand discovery in the meantime.

### Credential Helper (`scripts/job-vault.js`)

A small Node CLI that stores per-company ATS/portal login credentials (e.g. Workday, Greenhouse accounts) in the macOS Keychain instead of anywhere in the repo or a plaintext file. `job-applicator` calls it to retrieve saved logins when filling out application forms.

```
node scripts/job-vault.js list
node scripts/job-vault.js get "<Company Name>"
node scripts/job-vault.js set "<Company Name>"
node scripts/job-vault.js remove "<Company Name>"
```

Only a lookup index (company → Keychain service/account labels) is kept locally at `scripts/.job-vault-index.json`, which is gitignored. No passwords ever touch disk outside the Keychain.

### Coaching Tools (`coach-tools/`)

Generic career coaching frameworks used by the job-coach agent:

- Socratic question banks
- Bridge pivot (transferable skills mapping)
- Career transition frameworks (Ibarra's Working Identity)
- Competitive positioning research methodology
- Energy mapping (optimize time allocation)
- Odyssey plan (three 5-year paths)
- Role landscape reference (target role types, expectations, vocabulary)
- Execution workflow (state machine for job processing)

### Applications Completed (`Applications Completed/`)

A folder at the project root that stores job application folders once the application has been submitted.

```
job-hunt/
├── Applications Completed/
│   ├── Company Name A/
│   │   ├── CV.docx
│   │   ├── Cover Letter.docx
│   │   └── JD - Role Title.md
│   ├── Company Name B/
│   └── ...
├── Active Company/          ← in-progress application
└── ...
```

**Convention:** While an application is being prepared, the company folder lives in the project root. Once the user confirms submission, the job-coach agent moves the folder here and logs the application in the pipeline DB — both steps happen together as a single atomic action.

### Templates (`templates/`)

Empty-but-structured files for you to fill in with your own content:

- `MASTER_BULLETS.md` - Your accomplishment bullets by company
- `MASTER_PROFILES.md` - Resume profile paragraphs by theme
- `MASTER_SKILLS.md` - Skills organized by category
- `MASTER_COVER_LETTERS.md` - Gold standard cover letter archive
- `PERSONAL_INFO.md` - Contact info for application forms
- `ATS_TIPS.md` - Tips for specific Applicant Tracking Systems (Workday, Greenhouse, etc.)
- `CLAUDE.md` - Project-level Claude Code instructions
- `LINKEDIN_OUTREACH_TEMPLATES.md` - 9 categories of outreach message templates
- `CAREER_NARRATIVE.md` - Personal story and positioning themes
- `PROJECT_IDENTITY_MAP.md` - Map projects to identity/positioning themes
- `COVER_LETTER_FEEDBACK_LOG.md` - Track cover letter iterations and feedback
- `LINKEDIN_OUTREACH_LOG.md` - Track outreach messages and responses

Some coaching tools and agents also include `.example.md` files with filled-in samples to show what completed versions look like.

### Desktop App Prototype (`desktop-prototype/`)

An interactive, dependency-free frontend prototype explores how the toolkit could work as a desktop application alongside the existing CLI. It includes the overview, pipeline, jobs, applications, interviews, contacts, documents, activity, settings, job-readiness drawer, simulated add-job flow, and AI Coach panel.

The detailed production requirements, architecture, security model, state machines, delivery plan, and acceptance criteria are documented in [`docs/DESKTOP_APP_PRD.md`](docs/DESKTOP_APP_PRD.md). Run the prototype using the instructions in [`desktop-prototype/README.md`](desktop-prototype/README.md).

## Quick Start

### 1. Install
Open Claude Code and paste this repo URL:
```
https://github.com/neversettledwanderer/ai-job-hunt-toolkit
```

Tell Claude: "Clone this repo and set it up for me as a job hunting toolkit. Copy agents/ to ~/.claude/agents/, skills/ to ~/.claude/skills/, and create a new project folder at ~/job-hunt/ with the contents of templates/ and coach-tools/, plus .job-discovery-config.example.yaml from the repo root."

Claude Code loads agents and skills dynamically, so no restart is needed.

### 2. First Run
Open your new project folder in Claude Code and start the job-coach agent:
```
cd ~/job-hunt
claude --agent job-coach
```

The coach will walk you through everything:
1. **Config** -- name, contact info, career goals (5 min)
2. **Infrastructure** -- Supabase database and MCP server setup (10-15 min)
3. **Content** -- parse your existing resume(s) into the system (15-20 min)
4. **Triage rubric** -- define your personal job prioritization system (10 min)

### 3. Start Hunting
After setup, every session starts with the coach. It knows your pipeline, suggests what to work on next, and hands off to specialized agents for resume writing, cover letters, outreach, and applications.

## Architecture Decisions

**Why Supabase?** The MCP server runs as an Edge Function with direct database access. Row Level Security provides multi-tenant isolation if needed. The schema supports a single-user system but is designed for easy multi-tenant extension.

**Why launchd?** macOS native scheduler. No Docker, no cron, no cloud costs. The scripts run as the logged-in user, which means they can access the browser's auth state for LinkedIn scraping.

**Why separate agents?** Each agent has deep, specialized instructions. A single agent trying to do everything would have a massive prompt and make more mistakes. Specialized agents with focused instructions produce better results.

**Why MCP?** The Model Context Protocol lets Claude Code agents talk to the database through well-typed tools with built-in guardrails. The skill file (`SKILL.md`) adds an extra layer of protection against common agent mistakes.

**Why attribution logging?** Every record change is logged with who/what made the change. This is critical for debugging when multiple agents and automations touch the same data, and it powers the daily accountability tracking.

**Why tiered credentials?** The toolkit supports three credential backends: 1Password (most secure), OS keychain (macOS Keychain or Linux secret-tool), and `.env` files (simplest). The setup-assistant detects what's available and configures the best option. This means the toolkit works on any system without requiring 1Password.

**Cross-platform notes:** Scheduled automations use macOS launchd. On Linux, use cron or systemd instead. The setup-assistant only configures launchd on macOS.

## LinkedIn Automation Warning

The `enrich-job-postings.ts` and `posting-maintenance.ts` scripts use Playwright to visit LinkedIn job posting pages and extract publicly visible information. **The author of this toolkit received a warning from LinkedIn for using these scripts**, even with long delays between requests.

These scripts violate LinkedIn's Terms of Service. They are NOT enabled by default and must be explicitly opted into during setup. Use at your own risk.

The `contact-discovery` agent does NOT scrape LinkedIn. It opens search URLs in your browser for manual browsing and parses whatever you copy-paste into a scratchpad.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a running log of additions and changes.

## Credits

Originally built by [Daniel Frysinger](https://github.com/dfrysinger) during a 2026 job search using Claude Code — the toolkit represents months of iterative development, with each agent refined through hundreds of real job applications and the coaching frameworks developed through dozens of strategy sessions with the job-coach agent.

This fork adds the `job-finder-adzuna` agent (UK job boards), the `job-vault` Keychain credential helper, and additional security hardening for public distribution.

## License

MIT License. See [LICENSE](LICENSE) for details.
