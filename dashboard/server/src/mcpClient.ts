import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let clientPromise: Promise<Client> | null = null;

function mcpConfig(): { url: URL; key: string } {
  const base = process.env.SUPABASE_JOB_HUNT_URL;
  const key = process.env.SUPABASE_JOB_HUNT_KEY;
  if (!base || !key) {
    throw new Error("Missing SUPABASE_JOB_HUNT_URL/SUPABASE_JOB_HUNT_KEY in server/.env");
  }
  return { url: new URL(base), key };
}

export function getMcpClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { url, key } = mcpConfig();
      const client = new Client({ name: "job-hunt-dashboard", version: "0.1.0" });
      // The Edge Function's ?key= query-param auth path doesn't survive the
      // Supabase Functions gateway on POST requests (confirmed via curl) —
      // the x-brain-key header does, so that's what's used here.
      const transport = new StreamableHTTPClientTransport(url, {
        requestInit: { headers: { "x-brain-key": key } },
      });
      await client.connect(transport);
      return client;
    })().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export async function callTool<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const client = await getMcpClient();
  const result = await client.callTool({ name, arguments: args });
  const first = Array.isArray(result.content) ? result.content[0] : undefined;
  if (!first || first.type !== "text") {
    throw new Error(`Unexpected response shape from ${name}`);
  }
  if (result.isError) {
    throw new Error(`MCP tool ${name} failed: ${first.text}`);
  }
  return JSON.parse(first.text) as T;
}
