#!/bin/bash
# Refreshes cached credentials for launchd-triggered scripts.
# Run this manually whenever credentials change.
# Requires: op CLI with service account token available.

# Set your 1Password service account token. Adapt this to however you store it.
export OP_SERVICE_ACCOUNT_TOKEN=$(cat ~/op-token.txt)

if [ -z "$OP_SERVICE_ACCOUNT_TOKEN" ]; then
  echo "ERROR: Failed to extract OP service account token" >&2
  exit 1
fi

CREDS_FILE="$HOME/.config/job-hunt/creds.json"

# 1Password item names and vault are configurable via environment variables.
# Set these in your shell profile or pass them when running this script.
VAULT="${OP_VAULT_NAME:-Personal}"
SUPABASE_ITEM="${OP_SUPABASE_ITEM:-Supabase}"
SLACK_ITEM="${OP_SLACK_ITEM:-Slack Bot}"
GMAIL_ITEM="${OP_GMAIL_ITEM:-Gmail SMTP}"

SUPABASE_URL=$(op item get "$SUPABASE_ITEM" --vault "$VAULT" --fields label=project_url --reveal)
SUPABASE_KEY=$(op item get "$SUPABASE_ITEM" --vault "$VAULT" --fields label=service_role_key --reveal)
SLACK_TOKEN=$(op item get "$SLACK_ITEM" --vault "$VAULT" --fields label=credential --reveal)
SLACK_CHANNEL=$(op item get "$SLACK_ITEM" --vault "$VAULT" --fields label=channel --reveal)
GMAIL_EMAIL=$(op item get "$GMAIL_ITEM" --vault "$VAULT" --fields label=email --reveal)
GMAIL_APP_PASSWORD=$(op item get "$GMAIL_ITEM" --vault "$VAULT" --fields label=app_password --reveal)

python3 -c "
import json
creds = {
    'supabase_url': '$SUPABASE_URL',
    'supabase_key': '$SUPABASE_KEY',
    'slack_token': '$SLACK_TOKEN',
    'slack_channel': '$SLACK_CHANNEL',
    'gmail_email': '$GMAIL_EMAIL',
    'gmail_app_password': '$GMAIL_APP_PASSWORD',
}
with open('$CREDS_FILE', 'w') as f:
    json.dump(creds, f, indent=2)
print(f'Credentials cached to $CREDS_FILE')
"
chmod 600 "$CREDS_FILE"
