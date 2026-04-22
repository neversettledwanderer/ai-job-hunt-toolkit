# AI Job Hunt Toolkit

An AI-powered job hunting pipeline built on [Claude Code](https://claude.com/claude-code), Supabase, and macOS scheduled automations. Manages the entire job search lifecycle: resume optimization, cover letter writing, application form filling, LinkedIn outreach, contact networking, career coaching, and daily accountability tracking.

## How It Works

```
                    +-----------------+
                    |   Claude Code   |
                    |    (6 agents)   |
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

Six specialized Claude Code agents, each with deep domain instructions:

| Agent | Purpose |
|-------|---------|
| **resume-optimizer** | Creates tailored resumes from job postings using a master bullet library |
| **cover-letter-optimizer** | 4-phase pipeline: Briefing, Story Matching, Outline, Draft |
| **job-applicator** | Fills out application forms via Playwright (Workday, Greenhouse, Lever, etc.) |
| **linkedin-outreach** | Drafts personalized LinkedIn messages using 9 relationship-based templates |
| **contact-discovery** | Guides batch contact research sessions with LinkedIn |
| **job-coach** | Socratic career coaching with pipeline data access |

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
| `daily-status.ts --mode kickoff` | 12pm | Wake-up with targets and suggested jobs |
| `daily-status.ts --mode checkin` | 6pm | Afternoon progress update |
| `daily-status.ts --mode warning` | 11pm | Urgency alert if 50%+ of any track remains |
| `daily-status.ts --mode scorecard` | 1am | Final totals, streaks, trends |
| `daily-status.ts --mode weekly-summary` | Sunday 10am | List of previous week's applications |
| `enrich-job-postings.ts` | 10am daily | Scrape LinkedIn for missing job details |
| `posting-maintenance.ts` | Sunday 7am | Check active postings for expiration |

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
- `CLAUDE.md` - Project-level Claude Code instructions
- `LINKEDIN_OUTREACH_TEMPLATES.md` - 9 categories of outreach message templates
- `CAREER_NARRATIVE.md` - Personal story and positioning themes
- `PROJECT_IDENTITY_MAP.md` - Map projects to identity/positioning themes
- `COVER_LETTER_FEEDBACK_LOG.md` - Track cover letter iterations and feedback
- `LINKEDIN_OUTREACH_LOG.md` - Track outreach messages and responses

Some coaching tools and agents also include `.example.md` files with filled-in samples to show what completed versions look like.

## Quick Start

### 1. Set Up Supabase

1. Create a [Supabase](https://supabase.com) project
2. Run `mcp-server/schema/schema.sql` in the SQL editor to create tables
3. Deploy the MCP server as a Supabase Edge Function:
   ```bash
   supabase functions deploy job-hunt-mcp --project-ref YOUR_PROJECT_REF
   ```
4. Set environment variables on the Edge Function:
   - `MCP_ACCESS_KEY` - a secret key you generate for API authentication
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set automatically

### 2. Configure Claude Code

1. Copy agent files from `agents/` to `~/.claude/agents/`
2. Copy the skill file from `skills/job-hunt-mcp/SKILL.md` to `~/.claude/skills/job-hunt-mcp/SKILL.md`
3. Add the MCP server to your Claude Code config (`~/.claude/settings.json`):
   ```json
   {
     "mcpServers": {
       "job-hunt": {
         "url": "https://YOUR_PROJECT.supabase.co/functions/v1/job-hunt-mcp?key=YOUR_MCP_ACCESS_KEY"
       }
     }
   }
   ```
4. Copy template files from `templates/` to your resume project folder
5. Fill in the templates with your own content (bullets, skills, profiles, personal info)
6. Update file paths in agent definitions to point to your resume folder

### 3. Set Up Scheduled Automations (macOS only)

1. Install Deno: `brew install deno`
2. Set up credential caching:
   - Store your Supabase, Slack, and Gmail credentials in 1Password
   - Update `extension/scripts/refresh-creds.sh` with your 1Password item names
   - Run `./extension/scripts/refresh-creds.sh` to cache credentials
3. Update paths in the `.plist` files in `extension/launchd/` to match your installation
4. Copy `.plist` files to `~/Library/LaunchAgents/`
5. Load them: `launchctl load ~/Library/LaunchAgents/com.jobhunt.*.plist`

### 4. Set Up Notifications

**Slack:** Create a Slack app with a bot token and add it to a channel for notifications.

**Email:** Set up a Gmail App Password for SMTP notifications.

## Architecture Decisions

**Why Supabase?** The MCP server runs as an Edge Function with direct database access. Row Level Security provides multi-tenant isolation if needed. The schema supports a single-user system but is designed for easy multi-tenant extension.

**Why launchd?** macOS native scheduler. No Docker, no cron, no cloud costs. The scripts run as the logged-in user, which means they can access the browser's auth state for LinkedIn scraping.

**Why separate agents?** Each agent has deep, specialized instructions. A single agent trying to do everything would have a massive prompt and make more mistakes. Specialized agents with focused instructions produce better results.

**Why MCP?** The Model Context Protocol lets Claude Code agents talk to the database through well-typed tools with built-in guardrails. The skill file (`SKILL.md`) adds an extra layer of protection against common agent mistakes.

**Why attribution logging?** Every record change is logged with who/what made the change. This is critical for debugging when multiple agents and automations touch the same data, and it powers the daily accountability tracking.

## LinkedIn Automation Warning

The `enrich-job-postings.ts` and `posting-maintenance.ts` scripts use Playwright to visit LinkedIn job posting pages and extract publicly visible information. This is done with respectful delays between requests and uses your existing browser session.

**Be aware:** Automated access to LinkedIn may violate their Terms of Service. Use at your own risk. These scripts are designed to be conservative (long delays, small batches, headless browsing with your own auth), but LinkedIn's enforcement is unpredictable.

The `contact-discovery` agent does NOT scrape LinkedIn automatically. It opens search URLs in your browser for manual browsing and parses whatever you copy-paste into a scratchpad.

## Credits

Built by Daniel Frysinger during a 2026 job search using Claude Code.

This toolkit represents months of iterative development: each agent was refined through hundreds of real job applications, and the coaching frameworks were developed through dozens of strategy sessions with the job-coach agent.

## License

MIT License. See [LICENSE](LICENSE) for details.
