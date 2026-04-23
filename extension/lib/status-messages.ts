// lib/status-messages.ts
//
// Pure formatting functions. No I/O. Input: PipelineStats / WeeklySummary. Output: message strings.

import type { PipelineStats, WeeklySummary } from "./pipeline-stats.ts";
import { offsetDate } from "./pipeline-stats.ts";

export interface MessagePayload {
  slack: string;
  email: { subject: string; html: string };
}

// --- Daily pipeline summary ---

export function formatDailySummary(stats: PipelineStats): MessagePayload {
  const lines: string[] = ["*Pipeline Summary*"];

  // Last 7 days activity
  lines.push("");
  lines.push("*Last 7 Days:*");
  for (const t of stats.tracks) {
    if (t.weeklyAvg > 0) {
      lines.push(`  ${t.track}: ${(t.weeklyAvg * 7).toFixed(0)} completed (${t.weeklyAvg.toFixed(1)}/day)`);
    }
  }

  // Pipeline counts
  lines.push("");
  lines.push("*Pipeline:*");
  lines.push(`  Queue: ${stats.totalDrafts} jobs ready to work`);
  lines.push(`  Applied: ${stats.applicationsOut} waiting to hear back`);
  lines.push(`  Interviewing: ${stats.activeInterviews}`);

  if (stats.currentPace > 0 && stats.daysToClearBacklog !== null) {
    lines.push(`  Pace: ${stats.currentPace.toFixed(1)} apps/day, ~${stats.daysToClearBacklog} days to clear queue`);
  }

  // Aging alerts
  if (stats.staleQueue.length > 0) {
    lines.push("");
    lines.push("*Aging:*");
    for (const a of stats.staleQueue.slice(0, 5)) {
      const age = a.postingAgeDays !== null ? ` (posted ${a.postingAgeDays}d ago)` : "";
      lines.push(`  ${a.title} at ${a.company} -- in queue ${a.daysInQueue} days${age}`);
    }
  }

  const slack = lines.join("\n");
  return {
    slack,
    email: { subject: `Pipeline Summary -- ${stats.today}`, html: slackToHtml(slack) },
  };
}

// --- Sunday: Weekly application summary ---

function getWeekSunday(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00Z");
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function groupByWeek(applications: WeeklySummary["applications"]): Map<string, WeeklySummary["applications"]> {
  const weeks = new Map<string, WeeklySummary["applications"]>();
  for (const app of applications) {
    const sunday = getWeekSunday(app.appliedDate);
    if (!weeks.has(sunday)) weeks.set(sunday, []);
    weeks.get(sunday)!.push(app);
  }
  return weeks;
}

export function formatWeeklySummary(summary: WeeklySummary): MessagePayload {
  const count = summary.applications.length;
  const startUS = toUSDate(summary.weekStart);
  const endUS = toUSDate(summary.weekEnd);
  const lines: string[] = [
    "*Weekly Application Summary*",
    `*${startUS} to ${endUS}*`,
    "",
    `*${count} application${count !== 1 ? "s" : ""} submitted:*`,
  ];

  if (count === 0) {
    lines.push("");
    lines.push("No applications submitted this period.");
  } else {
    const weeks = groupByWeek(summary.applications);
    const multiWeek = weeks.size > 1;

    for (const [sunday, apps] of weeks) {
      if (multiWeek) {
        const saturday = offsetDate(sunday, 6);
        lines.push("");
        lines.push(`*Week of ${toUSDate(sunday)} to ${toUSDate(saturday)}:*`);
      }
      for (const app of apps) {
        lines.push("");
        lines.push(toUSDate(app.appliedDate));
        lines.push(app.company);
        lines.push(app.title);
        if (app.url) {
          lines.push(app.url);
        }
      }
    }
  }

  const slack = lines.join("\n");
  return {
    slack,
    email: {
      subject: `Weekly Applications: ${count} submitted (${startUS} to ${endUS})`,
      html: slackToHtml(slack),
    },
  };
}

// --- Helpers ---

function toUSDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${m}/${d}/${y}`;
}

function slackToHtml(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>\n");
  return `<html><body style="font-family: sans-serif; font-size: 14px; line-height: 1.6;">${html}</body></html>`;
}
