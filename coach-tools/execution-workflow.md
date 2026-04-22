# Job Execution Workflow

How the user works through their ranked pipeline, job by job. This is a reference for the coach and daily status agents to determine "what should the user do next?" without them having to derive it each session.

## Two Loops

### Loop 1: Triage (on intake or daily)

New jobs arrive from Slack pipeline, manual URL sharing, or other sources. They enter the DB unranked.

1. Coach proposes priority tier (high/medium/low) and rank using the triage rubric
2. the user confirms or adjusts
3. Jobs get committed to the ranked stack

The triage rubric is personal to each job hunter and lives in agent memory once established. If no rubric exists yet, the coach should initiate the rubric brainstorming exercise (see `coach-tools/triage-rubric.md`) before ranking any jobs. Example rubric: domain excitement > culture > location > comp > growth potential. Yours will be different.

### Loop 2: Execution (when the user sits down to work)

**Session start: check in on waiting jobs first.** Before picking up new work, scan any jobs at "outreach_in_progress" or "applied" and ask the user to check LinkedIn for replies, follow-up messages, or anything that needs a response. This takes 2 minutes and prevents messages from going stale. Only after follow-ups are handled, move to new work:

1. Pick the highest-ranked job with unfinished work
2. Do the next step for that job (see state machine below)
3. If blocked (waiting on outreach replies, etc.), drop to the next ranked job
4. When a blocked job unblocks (reply arrives, enough time passes), it jumps back to the top of the queue

Depth-first on top jobs, breadth-first only when blocked.

## State Machine: Steps for a Single Job

Each job progresses through these steps. The current step is derived from existing DB fields, not a separate tracking column.

### Step 1: Deep Read and Commitment

**Trigger:** Job is ranked but `networking_status = not_started` and no contacts exist.

**What happens:** the user opens the full JD, reads it carefully, and gut-checks excitement. If the job doesn't hold up on close reading, re-triage (adjust rank or demote to medium/low). If it holds up, proceed to contact research.

**How to detect:** Having a rank implies a first-pass read. Not having contacts implies it hasn't been deeply reviewed for execution yet. Once contact research starts, the deep read happened.

### Step 2: Contact Research

**Trigger:** Committed to the job, `networking_status = not_started`, no contacts.

**Who does it:** the user + contact-discovery agent. Manual LinkedIn browsing, agent parses and logs to DB.

**Done when:** `networking_status = researched` and `contact_count > 0`.

**If no contacts found:** Set `networking_status = done` (nothing to network on), skip to Step 5.

### Step 3: Outreach

**Trigger:** `networking_status = researched`, contacts exist, outreach not yet sent.

**Who does it:** the user sends messages manually. The linkedin-outreach agent drafts them.

**Done when:** `networking_status = outreach_in_progress`.

### Step 4: Follow Up and Wait for Replies

**Trigger:** `networking_status = outreach_in_progress`.

**What happens:** This is partially a blocker but NOT skip-entirely. At the start of every session, check these jobs for replies, follow-up messages that need responses, or connection requests that were accepted (opening the door for a message). Handle any follow-ups before moving to new work.

Between sessions, this is a blocker. Move to the next ranked job for new work. Come back next session to check again.

**Done when:** Replies received and processed, OR enough time has passed (2-3 days) that waiting longer has diminishing returns. Set `networking_status = done` when outreach cycle is complete.

**If a referral lands:** Great, note it on the application. Proceed to apply with referral context.

### Step 5: Resume Review

**Trigger:** `networking_status = done` (or skipped), application exists with `status = draft` and `resume_path` is set.

**Background:** The user generates resumes using the resume-optimizer agent when they are ready to work on a job. The agent reads the job description, selects bullets from the master list, and creates a tailored resume.

**Who does it:** the user triggers the resume-optimizer agent, reviews the generated resume, and requests changes if needed.

**Done when:** Application status updated from `draft` to `ready`.

**Note:** This step is often very quick. the user frequently reviews and applies in the same session.

### Step 6: Cover Letter (if needed)

**Trigger:** Application `status = ready`, no `cover_letter_path`, and the application warrants a cover letter.

**Who does it:** the user triggers the cover-letter-optimizer agent manually. Multi-step process: research, the user answers personal narrative questions, outline review, draft review, feedback loops.

**Done when:** `cover_letter_path` is set.

**Not all jobs need cover letters.** the user decides per-job. Skip this step if not needed.

### Step 7: Apply

**Trigger:** Application `status = ready`, resume reviewed, cover letter done (if needed).

**Who does it:** the user fills out the application. The job-applicator agent can help with Workday forms but is often too slow, so the user usually does this manually.

**Done when:** Application `status = applied`, `applied_date` is set.

### Step 8: Post-Apply Outreach (conditional)

**Trigger:** Application `status = applied` AND pre-apply networking did not result in a referral.

**What happens:** Reach out to recruiters or contacts to flag the application and send resume directly. This is the fallback when pre-apply networking didn't land an intro.

**Skip if:** A contact already referred the user in during Steps 3-4. The referral makes this redundant.

**Done when:** `networking_status = done` (if not already).

## Deriving "What's Next" from DB State

For any ranked job, read these fields to determine the current step:

| networking_status | contact_count | app status | resume_path | cover_letter | Current Step |
|---|---|---|---|---|---|
| not_started | 0 | none or draft | any | any | Step 1-2: Deep read + contact research |
| researched | > 0 | any | any | any | Step 3: Send outreach |
| outreach_in_progress | > 0 | any | any | any | Step 4: Blocked, waiting for replies |
| done | any | draft | exists | any | Step 5: Review resume |
| done | any | ready | exists | missing (needed) | Step 6: Cover letter |
| done | any | ready | exists | exists or not needed | Step 7: Apply |
| done | any | applied | exists | any | Step 8: Post-apply outreach (if no referral) |
| done | any | applied | exists | any | Done (if referral landed) |

Walk the ranked list top to bottom. The first job whose current step is actionable (not blocked) is what the user should work on next.

## Who Does What

| Step | the user | Agent | Automated |
|---|---|---|---|
| Triage/ranking | Confirms | Coach proposes | |
| Deep read | Does it | | |
| Contact research | LinkedIn browsing | contact-discovery parses + logs | |
| Outreach | Sends messages | linkedin-outreach drafts | |
| Resume creation | Triggers agent | resume-optimizer generates | |
| Resume review | Reviews + approves | resume-optimizer if changes needed | |
| Cover letter | Answers questions, reviews | cover-letter-optimizer drafts | |
| Application | Fills out form | job-applicator (Workday only, slow) | |
| Post-apply outreach | Sends messages | linkedin-outreach drafts | |
