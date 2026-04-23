## User Configuration

<!-- The job-coach agent will fill this in during your first session. -->
<!-- You can also edit it manually. -->

### Identity
- **Name:** [YOUR_NAME] <!-- legal name, used on resumes and applications -->
- **Target Role:** [YOUR_TARGET_ROLE] <!-- can skip, coach helps define later -->
- **Current/Previous Field:** [YOUR_CURRENT_FIELD] <!-- can skip -->
- **Target Field:** [YOUR_TARGET_FIELD] <!-- can skip -->

### Contact
- **Email:** [YOUR_EMAIL]
- **Phone:** [YOUR_PHONE]
- **LinkedIn:** [YOUR_LINKEDIN]
- **Portfolio:** [YOUR_PORTFOLIO] <!-- can skip if none -->
- **Location:** [YOUR_LOCATION]

### Job Title Rules
<!-- Populated during content bootstrapping from your resume -->
<!-- Lists your actual titles and allowed variations for resume headers -->

| Company | Base Title | Allowed Variations |
|---------|------------|-------------------|
| | | |

---

# Resume & Cover Letter Project

This project contains your resume and cover letter materials for job applications.

## Writing Style
- Never use em-dashes in writing. Avoid using parenthesis unless absolutely necessary. Use commas or separate sentences instead.

## Data Integrity Rules

- **Never overwrite a job posting's LinkedIn URL** with an ATS board URL (Greenhouse, Lever, Workday, etc.). The original LinkedIn URL is the source of truth. ATS URLs from confirmation emails belong in the notes field.
- **When merging duplicate postings,** preserve the LinkedIn `/jobs/view/` URL over any other URL format.

## Agent Instructions

Agent-specific instructions for specialized subagents live in `~/.claude/agents/` and should NOT be duplicated here. Available agents:
- `resume-optimizer.md` - Creates tailored resumes from job postings
- `job-applicator.md` - Fills out job application forms (Workday, Greenhouse, etc.)
- `cover-letter-optimizer.md` - Creates tailored cover letters
- `linkedin-outreach.md` - Drafts LinkedIn outreach messages
- `contact-discovery.md` - Guides batch contact research sessions and logs contacts to the database
- `job-coach.md` - Career strategy coaching: positioning, targeting, pipeline analysis

This file (CLAUDE.md) contains project-level context that applies to all conversations.

## Project Structure

- `MASTER_BULLETS.md` - All approved accomplishment bullets across resume variants
- `MASTER_PROFILES.md` - All approved profile paragraphs for different industries
- `MASTER_SKILLS.md` - All approved skills across resume variants
- `MASTER_COVER_LETTERS.md` - All approved cover letters and templates
- `LINKEDIN_OUTREACH_TEMPLATES.md` - Approved message templates for LinkedIn outreach
- `PERSONAL_INFO.md` - Contact info and standard application answers

## LinkedIn Outreach Agent

When asked to draft a LinkedIn message for a job application, follow the instructions in the linkedin-outreach agent (installed at `~/.claude/agents/linkedin-outreach.md`). The agent:

1. Fetches the job description from the provided URL
2. Looks for a company-specific resume in `[CompanyName]/` folder
3. Selects the appropriate template based on contact category
4. Customizes the message with role-specific highlights
5. Logs the outreach

**Relationship types (maps to `posting_contacts.relationship` in DB):**
- `colleague` - Someone you know/worked with directly
- `hiring_manager` - Hiring manager for the role
- `confirmed_recruiter` - Confirmed recruiter for this specific role
- `recruiter` - Recruiter at company, unknown if for this role
- `recruiting_lead` - Head of TA or senior recruiter
- `network` - 1st degree connection who can refer or intro
- `mutual_intro` - 2nd degree target; message goes to the mutual connection
- `employee` - Employee for culture/info gathering
- `executive` - C-level or VP, use concise high-signal pitch

## Contact Discovery Agent

When asked to research contacts for a job, use the `contact-discovery` agent. The agent:

1. Calls `get_networking_queue` to pull jobs where `networking_status = 'not_started'`
2. Opens LinkedIn search URLs in the browser for you to browse manually
3. Opens a freeform scratchpad file for you to dump findings
4. Parses whatever you paste: LinkedIn URLs, HTML snippets, or free text
5. Deduplicates against existing contacts in the database
6. Presents parsed contacts for confirmation and suggests relationship classification
7. Writes contacts to the database and sets `networking_status = 'researched'`

## Job Coach Agent

When asked for career strategy advice, use the `job-coach` agent. The agent:

1. Reads all master files and the coaching playbook on session start
2. Defaults to Socratic coaching: asks probing questions before giving answers
3. Switches to direct advisory mode when asked
4. Uses MCP tools to ground coaching in real pipeline data
5. Hands off to specialized agents for execution

## Resume Agent Instructions

After creating or updating a .docx resume file, open it for review:
```bash
open -a "Microsoft Word" "path/to/resume.docx"
```

### Experience Duration Guidelines

Be careful not to create misleading statements about how long you have done specific things.

**Avoid:**
- Combining total years with a specialty in a way that implies the specialty spans all those years

**Preferred patterns:**
- Separate total years of experience from specific domain expertise
- "[X] years of experience building and scaling product organizations. Currently focused on [domain]..."

## Cover Letter Agent

When asked to create a cover letter, follow the instructions in the cover-letter-optimizer agent (installed at `~/.claude/agents/cover-letter-optimizer.md`). The agent runs a 4-phase pipeline: Briefing, Story Matching, Outline, Draft.

