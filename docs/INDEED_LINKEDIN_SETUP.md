# Indeed and LinkedIn API Setup Guide

This guide walks through setting up the Indeed and LinkedIn MCPs for automated job discovery.

## Overview

The toolkit uses official APIs (not scraping) to search for jobs on Indeed and LinkedIn:
- **Indeed API**: REST API with job search capability
- **LinkedIn Jobs API**: LinkedIn's official Jobs API for structured searches

Both integrations are **opt-in** during setup. You can use one, both, or neither alongside manual job entry.

---

## Indeed API Setup

### Step 1: Create Indeed Developer Account

1. Go to https://developer.indeed.com
2. Sign up for a free developer account
3. Verify your email
4. Log in to the developer dashboard

### Step 2: Create an API Key

1. In the dashboard, navigate to **API Keys** or **Credentials**
2. Click **Create API Key**
3. Choose: "Job Search API" (free tier)
4. Accept terms
5. Your API key will appear (usually a long hex string)
6. **Copy and save** this key securely

### Step 3: Store API Key

The setup-assistant will ask where to store credentials:

**Option A: macOS Keychain (Recommended)**
```bash
security add-generic-password \
  -a "claude" \
  -s "INDEED_API_KEY" \
  -w "your-api-key-here"
```

**Option B: 1Password Vault**
- Create a new item of type "API Credential" or "Password"
- Label: `INDEED_API_KEY`
- Secret: your-api-key-here
- Save to your vault

**Option C: .env file**
```bash
cat > ~/.job-hunt/.env << EOF
INDEED_API_KEY=your-api-key-here
EOF
```

### Step 4: Register MCP in Claude Code

Add to `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "indeed": {
      "type": "http",
      "url": "https://api.indeed.com/graphql",
      "headers": {
        "Authorization": "Bearer <your-api-key>"
      }
    }
  }
}
```

The setup-assistant handles this automatically.

### Step 5: Test Connection

In job-coach agent, try:
"Search Indeed for Software Engineer in San Francisco, remote preferred"

If successful, you'll see results. If failed, check:
- API key is correct (try the API directly at https://developer.indeed.com/console)
- Network connectivity
- Credentials are loaded correctly

### Indeed API Limits

- **Free Tier**: 100 requests/month (enough for daily discovery)
- **Paid Tier**: Higher limits (if you outgrow free tier)

Search recommendations:
- 1-2 broad searches daily (e.g., "Software Engineer") gets 10-50 results
- Too many searches → too many results → overwhelming

---

## LinkedIn Jobs API Setup

### Step 1: Create LinkedIn App

1. Go to https://www.linkedin.com/developers/apps
2. Click **Create App**
3. Fill in:
   - **App name**: "Job Hunt Toolkit"
   - **LinkedIn Page**: (create a simple page or use personal)
   - **App logo**: (optional)
   - **Legal agreement**: Accept
4. Click **Create App**

### Step 2: Request Access to Jobs API

1. In your app settings, go to **Products**
2. Look for "Sign In with LinkedIn" or "LinkedIn Jobs API"
3. Request access (may require approval, usually instant)
4. Once approved, you'll get **Client ID** and **Client Secret**

### Step 3: Configure OAuth Redirect

1. In app settings, go to **Authorized redirect URLs**
2. Add: `http://localhost:3000/auth/callback` (or your redirect URL)
3. Save

### Step 4: Store Credentials

The setup-assistant will guide you through OAuth flow:

**Initial Setup**:
```bash
# setup-assistant will open a browser and guide you through OAuth
# You'll authorize the app once
# It will store the refresh token securely
```

**Option A: macOS Keychain**
```bash
security add-generic-password \
  -a "claude" \
  -s "LINKEDIN_CLIENT_ID" \
  -w "your-client-id"

security add-generic-password \
  -a "claude" \
  -s "LINKEDIN_CLIENT_SECRET" \
  -w "your-client-secret"

security add-generic-password \
  -a "claude" \
  -s "LINKEDIN_REFRESH_TOKEN" \
  -w "refresh-token-from-oauth-flow"
```

**Option B: 1Password**
- Create items for CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
- Label each appropriately

**Option C: .env file**
```bash
cat >> ~/.job-hunt/.env << EOF
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_REFRESH_TOKEN=refresh-token-from-flow
EOF
```

### Step 5: Register MCP in Claude Code

Add to `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "linkedin": {
      "type": "http",
      "url": "https://api.linkedin.com/v2/jobs",
      "headers": {
        "Authorization": "Bearer <access-token>"
      }
    }
  }
}
```

The setup-assistant handles this automatically, including OAuth token refresh.

### Step 6: Test Connection

In job-coach agent, try:
"Search LinkedIn for Staff Engineer in San Francisco, senior experience"

If successful, you'll see results. If failed, check:
- OAuth token is valid (setup-assistant should auto-refresh)
- Client ID and Secret are correct
- LinkedIn app is approved for Jobs API

### LinkedIn API Limits

- **Free Tier**: 10,000 calls/month (plenty for daily discovery)
- **Rate Limit**: 300 calls/minute (respected automatically)

Search recommendations:
- 1-2 targeted searches daily (e.g., "Staff Engineer", "CTO")
- LinkedIn results are typically higher-quality (company info, network connections)

---

## Configuration: .job-discovery-config.yaml

After setting up credentials, create `.job-discovery-config.yaml` in your job-hunt project:

```yaml
indeed:
  enabled: true
  searches:
    - title: "Software Engineer"
      location: "San Francisco, CA"
      keywords: "Python,TypeScript"
      radius: 50
      salary_min: 150000
      remote: "any"

linkedin:
  enabled: true
  searches:
    - title: "Software Engineer"
      locations: ["San Francisco, CA", "Remote"]
      experience_level: ["mid", "senior"]
```

See `templates/.job-discovery-config.example.yaml` for a complete example.

---

## Troubleshooting

### "Invalid API Key" (Indeed)

**Fix**:
1. Re-check your key at https://developer.indeed.com (copy again if needed)
2. Re-run setup-assistant to update stored credentials
3. Test the API directly using curl:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.indeed.com/graphql" \
     -d '{"query":"query { jobSearch(query:\"engineer\") { results { title } } }"}'
   ```

### "Unauthorized" (LinkedIn)

**Fix**:
1. Check if OAuth token expired (setup-assistant auto-refreshes, but may fail)
2. Re-run setup-assistant to re-authorize
3. Verify Client ID and Client Secret at https://www.linkedin.com/developers/apps

### "Too many requests" (API rate limit)

**Fix**:
- Reduce number of searches in `.job-discovery-config.yaml`
- Reduce search frequency (don't search every hour)
- Wait a few minutes before retrying
- Rate limits reset after 1 hour (Indeed) or 1 minute (LinkedIn)

### "Search returned 0 results"

**Fix**:
- Try broadening your criteria (remove keywords, expand location, lower salary)
- Check if jobs exist on the platform for your search
- Try different job titles (e.g., "Backend Engineer" vs. "Server Engineer")

---

## Daily Automation

Once credentials are set up, enable daily discovery:

1. In job-coach agent: "I want daily automated job discovery"
2. setup-assistant will:
   - Enable `.job-discovery-config.yaml`
   - Set up launchd plists (macOS) or cron (Linux)
   - Schedule searches for 6am (Indeed) and 8am (LinkedIn)
3. On the next day at 6am, jobs will automatically populate your pipeline

---

## Privacy & Security

**API Keys & Tokens**:
- Stored securely in Keychain/1Password (never in git)
- Not transmitted to Supabase
- Not logged (except in error messages you see)

**Job Data**:
- Fetched jobs are stored in your private Supabase instance
- You control who has access (user_id scoped)
- Never shared with third parties

**OAuth**: 
- LinkedIn OAuth flow is handled by your app (not third-party)
- Refresh tokens are stored locally, not in the cloud

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review MCP error messages in Claude Code console
3. Check API status pages:
   - Indeed: https://developer.indeed.com
   - LinkedIn: https://www.linkedin.com/developers

For bugs in the toolkit, report at: https://github.com/dfrysinger/ai-job-hunt-toolkit/issues
