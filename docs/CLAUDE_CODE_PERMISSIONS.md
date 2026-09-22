# Claude Code permission guidance

Claude Code permission settings are user- or machine-specific and should not be copied into a shared project with personal settings. Configure them in the user's local Claude Code settings.

For this toolkit, set these operations to **ask** rather than auto-allow:

- `mcp__job-hunt__submit_application`
- `mcp__job-hunt__update_application`
- `mcp__job-hunt__update_job_posting`
- `mcp__job-hunt__add_job_posting`
- `mcp__job-hunt__delete_job_posting`
- `mcp__job-hunt__add_job_contact`
- `Bash(supabase db push *)`
- `Bash(supabase functions deploy *)`

Keep destructive or externally visible actions behind a user confirmation. Review local allow rules for broader patterns that might bypass a specific ask rule. Prompt instructions are not a substitute for runtime permission controls, and permission controls do not replace reviewing the proposed change.

Do not put API keys, personal contact details, or candidate-specific evidence into this shared guidance file.
