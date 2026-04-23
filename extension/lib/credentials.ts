// lib/credentials.ts
//
// Tiered credential lookup:
// 1. 1Password (if OP_VAULT_NAME is set and op CLI available)
// 2. OS keychain (macOS Keychain, Linux secret-tool)
// 3. .env file (extension/.env)
// 4. Environment variables (fallback)

import "jsr:@std/dotenv/load";

// Map logical credential names to their .env variable names
const CREDENTIAL_MAP: Record<string, string> = {
  "supabase_url": "SUPABASE_URL",
  "supabase_key": "SUPABASE_SERVICE_ROLE_KEY",
  "slack_token": "SLACK_BOT_TOKEN",
  "slack_channel": "SLACK_CHANNEL",
  "gmail_email": "GMAIL_EMAIL",
  "gmail_password": "GMAIL_APP_PASSWORD",
  "weekly_recipients": "WEEKLY_SUMMARY_RECIPIENTS",
};

// 1Password item field mapping (configurable via env)
const OP_ITEM_MAP: Record<string, { itemEnv: string; field: string }> = {
  "supabase_url": { itemEnv: "OP_SUPABASE_ITEM", field: "project_url" },
  "supabase_key": { itemEnv: "OP_SUPABASE_ITEM", field: "service_role_key" },
  "slack_token": { itemEnv: "OP_SLACK_ITEM", field: "credential" },
  "slack_channel": { itemEnv: "OP_SLACK_ITEM", field: "channel" },
  "gmail_email": { itemEnv: "OP_GMAIL_ITEM", field: "email" },
  "gmail_password": { itemEnv: "OP_GMAIL_ITEM", field: "app_password" },
};

async function readFrom1Password(credential: string): Promise<string | null> {
  const vault = Deno.env.get("OP_VAULT_NAME");
  const token = Deno.env.get("OP_SERVICE_ACCOUNT_TOKEN");
  if (!vault || !token) return null;

  const mapping = OP_ITEM_MAP[credential];
  if (!mapping) return null;

  const itemName = Deno.env.get(mapping.itemEnv);
  if (!itemName) return null;

  try {
    const proc = new Deno.Command("op", {
      args: ["item", "get", itemName, "--vault", vault, "--fields", `label=${mapping.field}`, "--reveal"],
      env: { ...Deno.env.toObject(), OP_SERVICE_ACCOUNT_TOKEN: token, OP_BIOMETRIC_UNLOCK_ENABLED: "false" },
      stdout: "piped",
      stderr: "piped",
    });
    const output = await proc.output();
    if (!output.success) return null;
    const value = new TextDecoder().decode(output.stdout).trim();
    return value || null;
  } catch {
    return null;
  }
}

async function readFromKeychain(credential: string): Promise<string | null> {
  const serviceName = `job-hunt-toolkit-${credential}`;

  if (Deno.build.os === "darwin") {
    try {
      const proc = new Deno.Command("security", {
        args: ["find-generic-password", "-s", serviceName, "-w"],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await proc.output();
      if (!output.success) return null;
      return new TextDecoder().decode(output.stdout).trim() || null;
    } catch {
      return null;
    }
  }

  if (Deno.build.os === "linux") {
    try {
      const proc = new Deno.Command("secret-tool", {
        args: ["lookup", "service", serviceName],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await proc.output();
      if (!output.success) return null;
      return new TextDecoder().decode(output.stdout).trim() || null;
    } catch {
      return null;
    }
  }

  return null;
}

function readFromEnv(credential: string): string | null {
  const envKey = CREDENTIAL_MAP[credential];
  if (!envKey) return null;
  const value = Deno.env.get(envKey);
  return value || null;
}

export async function readCredential(credential: string): Promise<string> {
  // Tier 1: 1Password
  const opValue = await readFrom1Password(credential);
  if (opValue) return opValue;

  // Tier 2: OS keychain
  const keychainValue = await readFromKeychain(credential);
  if (keychainValue) return keychainValue;

  // Tier 3: .env file / environment variables
  const envValue = readFromEnv(credential);
  if (envValue) return envValue;

  throw new Error(
    `Credential "${credential}" not found. Check your .env file, OS keychain, or 1Password configuration. See extension/.env.example for setup.`
  );
}

// Optional credential read (returns null instead of throwing)
export async function readCredentialOptional(credential: string): Promise<string | null> {
  try {
    return await readCredential(credential);
  } catch {
    return null;
  }
}
