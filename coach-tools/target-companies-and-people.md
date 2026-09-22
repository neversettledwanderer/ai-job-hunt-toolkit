# Target Companies and People to Follow

Use this workflow when the user wants to identify employers worth watching, discover relevant people to learn from, or explore a company before a suitable vacancy exists. It complements role discovery and per-vacancy contact research; it does not replace either.

## Inputs

- User-approved target role lanes and transferable experience
- Location, work pattern, salary, sector, and other stated constraints
- Existing company and job records, where available
- Research date and sources that can be accessed

If a material preference is unknown, ask briefly or label it unknown. Do not turn an assumed preference into a filter.

## Company research

Research a focused shortlist of up to five companies at a time. Include a mix of realistic targets and, when the user wants it, one or two ambitious targets. Use current, attributable public sources, prioritising company career pages and first-party material.

For each company, report:

| Field | What to record |
|---|---|
| Company | Name and official website |
| Role-lane connection | Which user-approved lane(s) make it relevant |
| Evidence of fit | Specific product, service, team, sector, or public priority that connects to verified experience |
| Vacancy status | Verified suitable vacancy, no suitable vacancy found, or unknown; include the careers-page/source link and date checked |
| Work and location | Publicly stated location or work pattern relevant to the user's constraints; otherwise unknown |
| Gaps or trade-offs | Material missing evidence, constraint mismatch, or uncertainty |
| Next action | A proportionate step such as monitor careers page, research a team, or stop |

Do not treat a company announcement, expansion, or public problem as proof of a vacancy. Mark interpretations as hypotheses and distinguish them from verified facts. Recommend a company because of a specific evidence-based fit, not reputation alone.

## People to follow

Find a small, relevant set of practitioners, team leaders, or recruiters whose public professional work can help the user understand the role or employer. Prefer people with accessible posts, talks, articles, projects, or portfolios related to the user's target lanes.

For each person, record:

| Field | What to record |
|---|---|
| Person and current role | Name, publicly stated title, and organisation |
| Public profile/source | Link and date checked |
| Why follow | Specific work, idea, or topic useful to the user's learning or role research |
| Relationship status | `Follow/learn` or `Potential contact` |
| Contact rationale | For potential contacts only, a specific, credible reason to approach; otherwise leave blank |
| Next action | Follow, read/watch a named item, or do nothing |

Seeing a profile, sharing an employer, or posting a vacancy is not by itself a reason to contact someone. Do not infer private details, guess contact information, send messages, or add a watch-only person to the networking database. Contact discovery and all database writes remain subject to their existing user-confirmation gates.

## Handoff

Present no more than five companies and five people in one pass. Include sources, dates checked, unknowns, and the user's likely next decision. Ask which entries the user wants to keep. Save an approved shortlist in `TARGET_COMPANIES_AND_PEOPLE.md` in the project root, preserving source links and check dates. Keep confirmed vacancies in the job pipeline; do not create speculative job postings for companies with no verified opening.

Review the shortlist when the user changes role lanes or constraints, or when a saved company's evidence becomes stale. Do not schedule recurring searches unless a working scheduler and its actual source coverage have been verified.
