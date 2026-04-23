# AI Job Hunt Toolkit

An AI-powered job hunting pipeline built on [Claude Code](https://claude.com/claude-code), Supabase, and macOS scheduled automations. Manages the entire job search lifecycle: resume optimization, cover letter writing, application form filling, LinkedIn outreach, contact networking, career coaching, and daily accountability tracking.

## How It Works

```
                    +-----------------+
                    |   Claude Code   |
                    |    (7 agents)   |
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

Seven specialized Claude Code agents, each with deep domain instructions:

| Agent | Purpose |
|-------|---------|
| **resume-optimizer** | Creates tailored resumes from job postings using a master bullet library |
| **cover-letter-optimizer** | 4-phase pipeline: Briefing, Story Matching, Outline, Draft |
| **job-applicator** | Fills out application forms via Playwright (Workday, Greenhouse, Lever, etc.) |
| **linkedin-outreach** | Drafts personalized LinkedIn messages using 9 relationship-based templates |
| **contact-discovery** | Guides batch contact research sessions with LinkedIn |
| **job-coach** | Socratic career coaching with pipeline data access |
| **setup-assistant** | Infrastructure setup: Supabase, MCP server, credentials, notifications |

### MCP Server (`mcp-server/`)

A Supabase Edge Function that exposes job pipeline tools via the Model Context Protocol. Agents use these tools to:

- Track companies, postings, and applications
- Manage contacts and networking status
- Schedule and log interviews
- Maintain an attribution log (who/what created or changed each record)
- Stack-rank postings within priority tiers

### Scheduled Automations (`extension/`)

Deno scripts triggered by macOS launchd on a schedule:

| Script | Schedule | Purpose |
|--------|----------|---------|
| `daily-status.ts --mode daily` | Daily | Pipeline summary: last 7 days activity and next steps |
| `daily-status.ts --mode weekly-summary` | Sunday 10am | Weekly application summary email |
| `enrich-job-postings.ts` | 10am daily | Scrape LinkedIn for missing job details (opt-in, see warning below) |
| `posting-maintenance.ts` | Sunday 7am | Check active postings for expiration (opt-in, see warning below) |

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

## Quick Start

### 1. Install
Open Claude Code and paste this repo URL:
```
https://github.com/dfrysinger/ai-job-hunt-toolkit
```

Tell Claude: "Clone this repo and set it up for me as a job hunting toolkit. Copy agents/ to ~/.claude/agents/, skills/ to ~/.claude/skills/, and create a new project folder at ~/job-hunt/ with the contents of templates/ and coach-tools/."

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

## Credits

Built by Daniel Frysinger during a 2026 job search using Claude Code.

This toolkit represents months of iterative development: each agent was refined through hundreds of real job applications, and the coaching frameworks were developed through dozens of strategy sessions with the job-coach agent.

## License

MIT License. See [LICENSE](LICENSE) for details.
