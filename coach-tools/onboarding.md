# Onboarding Interview

Triggered when the job-coach detects `[YOUR_` placeholders in CLAUDE.md's User Configuration section during session-start Step 1.

## Purpose

Walk a new user through filling in their personal configuration so all agents can function. This replaces the old approach of manually hunting through files to fill in placeholders.

## Detection

Check ONLY the User Configuration section of CLAUDE.md (between `## User Configuration` and the next `##` heading). If any `[YOUR_` string appears in that section, onboarding is incomplete.

## Interview Flow

### 1. Greeting

"Looks like this is your first time using the toolkit. Let me help you get set up. I'll ask a few questions and fill in your config automatically."

### 2. Required Field

Name is the only required field. Agents use it for filenames, document headers, and signatures. Push back if skipped.

Ask: "What's your full legal name? This is what appears on resumes and applications."

### 3. Recommended Fields

Ask one at a time. These make resumes and outreach much better but nothing breaks without them. Accept "skip" gracefully with no judgment.

- **Email:** "What's your email address?"
- **Phone:** "Phone number?"
- **LinkedIn:** "What's your LinkedIn URL?"
- **Location:** "Where are you based? City and state is fine."
- **Portfolio:** "Do you have a portfolio or personal website? If not, just say skip."
- **Target Role:** "What kind of role are you targeting? If you're not sure yet, we can figure that out together later."
- **Current/Previous Field:** "What field are you coming from?"
- **Target Field:** "What field are you moving into? Same as current is fine."

### 4. Extended Info

"Application forms sometimes ask for your mailing address, pronouns, work authorization, and demographics. Want to fill those in now? We can always do this later."

If yes, check that PERSONAL_INFO.md exists in the project directory. If not: "I don't see PERSONAL_INFO.md in this directory. Copy it from the toolkit's templates/ folder and let me know when it's ready."

Walk through PERSONAL_INFO.md fields:
- Mailing address (street, city, state, zip)
- Pronouns
- Work authorization (legally authorized to work in US)
- Visa sponsorship needed
- Salary range
- Willing to relocate
- EEO demographics (gender, race/ethnicity, veteran status, disability status)

If no, leave PERSONAL_INFO.md fields as-is. They remain as placeholders, which is fine since PERSONAL_INFO.md is not checked by onboarding detection.

### 5. Write Config

Replace all `[YOUR_*]` placeholders in the User Configuration section of CLAUDE.md with the user's answers:
- Answered fields: replace placeholder with the value
- Skipped fields: replace placeholder with blank (empty after the colon)
- After writing: NO `[YOUR_` strings should remain in the User Configuration section

For PERSONAL_INFO.md (if the user opted in):
- Replace all fields the user provided answers for
- Replace literal `Yes/No` with the user's actual answer
- Replace `$[MIN] - $[MAX]` with the user's salary range
- Fields the user didn't answer: leave as-is in PERSONAL_INFO.md

### 6. Verify

Read back the config to the user: "Here's what I've got:" and list all fields with their values or "(skipped)".

Ask: "Anything wrong or want to change?"

### 7. Transition

Return to the job-coach's session-start Step 2 (MCP check). The sequence continues: MCP check, master files, content bootstrapping, triage rubric.

## Re-entry

If a user partially completes onboarding and quits, remaining `[YOUR_` placeholders in the User Configuration section trigger onboarding again next session. Only ask about fields that still have placeholders. Fields already filled in or blanked out are skipped.

## Skipped Field Behavior

- Skipped fields get the placeholder replaced with blank (empty string after the colon)
- Agents check "is the field non-empty?" to decide whether to use it
- Coach-tools that reference optional career identity fields ask the user in the moment if blank
