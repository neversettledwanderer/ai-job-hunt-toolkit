# Content Bootstrapping

Triggered when the job-coach detects empty master files during session-start Step 4. The coach runs this in the main conversation (not a sub-agent) since it requires multi-turn interaction.

## Purpose

Parse the user's existing resume(s) and career materials into the master file structure so the other agents (resume-optimizer, cover-letter-optimizer, linkedin-outreach) have content to work with.

## Detection

Read MASTER_BULLETS.md. If it contains only template headings and no actual bullets (or is empty), bootstrapping hasn't been done. Same check for MASTER_SKILLS.md and MASTER_PROFILES.md. All three must have real content for this step to pass.

This check fires every session until all three files have content.

## Flow

### 1. Ask for Resumes

"To get started, I need to understand your background. Do you have an existing resume you can share? If you have multiple versions tailored for different types of roles, even better. The more variants I can see, the richer your bullet and skills library will be. Drop in PDFs, .docx files, or just paste the text. One is great, several is even better."

Make it clear that having only one resume is perfectly fine, and having many is a bonus, not an expectation. No judgment either way.

### 2. Parse All Resumes into Master Files

**MASTER_BULLETS.md:**
- Extract accomplishment bullets from ALL provided resumes
- Organize by company/role with headings: company name, role title, dates
- Deduplicate bullets that appear across variants
- When variants phrase the same accomplishment differently, keep all versions (they represent different angles the user has tested)
- Preserve the user's original phrasing
- Show the user the parsed bullets and ask for confirmation before writing

**MASTER_SKILLS.md:**
- Extract skills from ALL variants, deduplicate
- Categorize (technical, leadership, domain, tools, etc.)
- Different resumes may emphasize different skill sets, which is exactly what the skills library needs
- Format to max 30 characters per skill
- Show the user and ask for confirmation

**MASTER_PROFILES.md:**
- If any resume has a summary/objective/profile section, capture each unique version as a separate profile entry
- Tag each with the angle it takes (e.g., "product leadership," "technical strategy," "design-to-PM bridge")
- If none have profiles, draft one based on the parsed experience and ask the user to review

**Job Title Rules (CLAUDE.md):**
- Extract company names and titles from the resume(s)
- Write them to the Job Title Rules table in CLAUDE.md's User Configuration section
- Format: Company | Base Title | Allowed Variations (ask user about variations)

**PERSONAL_INFO.md Education:**
- Extract education entries (degree, field, university, year)
- Write to PERSONAL_INFO.md's Education section

### 3. Career Narrative

CAREER_NARRATIVE.md gives agents (especially cover-letter-optimizer and linkedin-outreach) raw material to draw from: stories, passions, and context. The strategic positioning layer develops through coaching sessions later. Bootstrapping just captures the raw inputs.

Ask gentle, open-ended questions:
- "What are you most passionate about in your work?"
- "What are you most proud of in your career?"
- "What are you looking for in your next role?"

Write answers to CAREER_NARRATIVE.md as raw notes. Do NOT attempt to derive a polished narrative during bootstrapping. The coach refines these into positioning themes, a career throughline, and a story library over subsequent sessions.

### 4. Cover Letter References

"Have any cover letters you were particularly happy with? If so, share them and I'll add them to your reference library."

If yes: parse and add to MASTER_COVER_LETTERS.md (max 5 slots).
If no: skip.

### 5. Outreach Templates

LINKEDIN_OUTREACH_TEMPLATES.md ships with generic templates.

Ask: "Want to customize the outreach message templates, or are the defaults fine for now?"

Most users will skip this initially.

### 6. Review

"I've populated your master files from your resume. Want to review any of them?"

Open whichever files the user wants to check.

## What This Does NOT Do

- Does not create tailored resumes (that's resume-optimizer's job)
- Does not write cover letters (that's cover-letter-optimizer's job)
- Does not fabricate experience. Everything comes from the user's existing materials.
- Does not replace the user's judgment. Always shows parsed results and asks for confirmation.
