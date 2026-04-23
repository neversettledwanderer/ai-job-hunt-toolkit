// scripts/daily-status.ts
//
// Pipeline status notifications. Accepts a --mode argument:
//   daily          — pipeline summary with recent activity and queue status
//   weekly-summary — list of previous week's applications (sent via email)
//
// Sends to Slack (if configured) and email (Gmail SMTP).

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendSlackMessage, getCaptureChannel } from "../lib/slack.ts";
import { sendEmail } from "../lib/email.ts";
import { fetchPipelineStats, fetchWeeklySummary } from "../lib/pipeline-stats.ts";
import {
  formatDailySummary,
  formatWeeklySummary,
} from "../lib/status-messages.ts";
import { readCredential, readCredentialOptional } from "../lib/credentials.ts";

async function getSupabaseClient() {
  const url = await readCredential("supabase_url");
  const key = await readCredential("supabase_key");
  return createClient(url, key);
}

// --- Parse --mode argument ---
function getMode(): string {
  const idx = Deno.args.indexOf("--mode");
  if (idx === -1 || idx + 1 >= Deno.args.length) {
    throw new Error("Usage: daily-status.ts --mode <daily|weekly-summary>");
  }
  const mode = Deno.args[idx + 1];
  if (!["daily", "weekly-summary"].includes(mode)) {
    throw new Error(`Unknown mode: ${mode}. Must be one of: daily, weekly-summary`);
  }
  return mode;
}

// --- Main ---
async function main() {
  const mode = getMode();
  console.log(`[${new Date().toISOString()}] daily-status running in mode: ${mode}`);

  const supabase = await getSupabaseClient();

  let payload: { slack: string; email: { subject: string; html: string } } | null = null;

  if (mode === "weekly-summary") {
    const fromIdx = Deno.args.indexOf("--from");
    const toIdx = Deno.args.indexOf("--to");
    const fromDate = fromIdx !== -1 ? Deno.args[fromIdx + 1] : undefined;
    const toDate = toIdx !== -1 ? Deno.args[toIdx + 1] : undefined;
    if (fromDate && !/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
      throw new Error(`Invalid --from date: ${fromDate}. Expected YYYY-MM-DD format.`);
    }
    if (toDate && !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      throw new Error(`Invalid --to date: ${toDate}. Expected YYYY-MM-DD format.`);
    }
    const summary = await fetchWeeklySummary(supabase, { from: fromDate, to: toDate });
    payload = formatWeeklySummary(summary);
  } else {
    const stats = await fetchPipelineStats(supabase);
    payload = formatDailySummary(stats);
  }

  if (!payload) {
    throw new Error(`No payload generated for mode: ${mode}. This is a bug in the dispatch logic.`);
  }

  let slackOk = false;
  let emailOk = false;

  // Send Slack (graceful skip if not configured)
  try {
    const channel = await getCaptureChannel();
    await sendSlackMessage(channel, payload.slack);
    console.log("Slack message sent.");
    slackOk = true;
  } catch (err) {
    console.warn("Slack send skipped or failed:", err);
  }

  // Send email
  try {
    const emailOpts: { subject: string; html: string; to?: string } = {
      subject: payload.email.subject,
      html: payload.email.html,
    };
    if (mode === "weekly-summary") {
      const recipients = await readCredentialOptional("weekly_recipients");
      const fallback = await readCredential("gmail_email");
      emailOpts.to = recipients ?? fallback;
    }
    await sendEmail(emailOpts);
    console.log("Email sent.");
    emailOk = true;
  } catch (err) {
    console.error("Email send failed:", err);
  }

  if (!slackOk && !emailOk) {
    console.error("FATAL: Both Slack and email delivery failed. No notification was sent.");
    Deno.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  Deno.exit(1);
});
