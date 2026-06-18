# Pipeline API Reference — Direct Curl Method

The job-hunt pipeline is a Supabase Edge Function. In sessions where MCP tools are not registered, the pipeline can be called directly via HTTP using the pattern below.

**Why this matters:** MCP server registration is not guaranteed in every Claude Code session. Having a direct API method means the coach never loses pipeline access.

---

## Standard Call Pattern

```bash
curl -s -X POST '{SUPABASE_EDGE_FUNCTION_URL}?key={API_KEY}' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"TOOL_NAME","arguments":{...}}}' \
  | grep '^data:' | sed 's/^data: //' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); content=d.get('result',{}).get('content',[]); print(content[0]['text'] if content else json.dumps(d, indent=2))"
```

**Important:** The endpoint returns Server-Sent Events (`text/event-stream`), not plain JSON. Always pipe through `grep '^data:'` and strip the `data: ` prefix before parsing.

---

## Setup

During initial setup, the setup-assistant agent stores two values you will need here:

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_EDGE_FUNCTION_URL` | Supabase dashboard → Edge Functions → your function URL |
| `API_KEY` | The access key generated during setup-assistant (stored in Keychain or `.env`) |

---

## Example Calls

### Get pipeline overview

```bash
curl -s -X POST 'https://<project>.supabase.co/functions/v1/job-hunt-mcp?key=<api-key>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_pipeline_overview","arguments":{}}}' \
  | grep '^data:' | sed 's/^data: //' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); content=d.get('result',{}).get('content',[]); print(content[0]['text'] if content else json.dumps(d, indent=2))"
```

### Add a job posting

```bash
curl -s -X POST 'https://<project>.supabase.co/functions/v1/job-hunt-mcp?key=<api-key>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"tools/call",
    "params":{
      "name":"add_job_posting",
      "arguments":{
        "url":"https://www.linkedin.com/jobs/view/1234567890/",
        "title":"AI Adoption Specialist",
        "company":"Example Corp",
        "location":"London, UK",
        "salary_min":55000,
        "salary_max":70000,
        "source":"linkedin",
        "priority":"medium"
      }
    }
  }' \
  | grep '^data:' | sed 's/^data: //' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); content=d.get('result',{}).get('content',[]); print(content[0]['text'] if content else json.dumps(d, indent=2))"
```

### List available tools

To discover all available MCP tool names:

```bash
curl -s -X POST 'https://<project>.supabase.co/functions/v1/job-hunt-mcp?key=<api-key>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | grep '^data:' | sed 's/^data: //' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); tools=d.get('result',{}).get('tools',[]); [print(t['name']) for t in tools]"
```

---

## Response Format

All responses follow this structure after stripping the SSE wrapper:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "... the actual response ..."
      }
    ]
  }
}
```

If the call fails, check for an `"error"` key instead of `"result"`.

---

## When to Use This

Use direct curl calls when:
- The MCP server is not registered in the current Claude Code session
- You are running a script outside of Claude Code (e.g. a scheduled automation)
- You need to verify the pipeline is working independently of MCP

In normal Claude Code sessions with MCP configured, use the MCP tools directly (`get_pipeline_overview`, `add_job_posting`, etc.) — they are more concise and handle the SSE parsing for you.

---

*Reference added during active use — 2026-05-20. See setup-assistant.md for MCP registration instructions.*
