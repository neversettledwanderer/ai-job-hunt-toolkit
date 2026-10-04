import { Router } from "express";
import { callTool } from "./mcpClient.js";

export const router = Router();

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function bool(v: unknown): boolean | undefined {
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

const APPLICATION_STATUSES = new Set([
  "draft", "ready", "applied", "screening", "interviewing",
  "offer", "accepted", "rejected", "withdrawn",
]);
const POSTING_SOURCES = new Set([
  "linkedin", "greenhouse", "lever", "workday", "indeed",
  "company-site", "referral", "recruiter", "other",
]);
const PRIORITIES = new Set(["high", "medium", "low"]);
const POSTING_STATUSES = new Set(["active", "closed"]);
const NETWORKING_STATUSES = new Set(["not_started", "researched", "outreach_in_progress", "done"]);
const CONTACT_ROLES = new Set(["recruiter", "hiring_manager", "referral", "interviewer", "other"]);

router.get("/pipeline-overview", async (_req, res) => {
  const data = await callTool("get_pipeline_overview");
  res.json(data);
});

router.get("/postings", async (req, res) => {
  const { query, status, source, priority, posting_status } = req.query;
  const args: Record<string, unknown> = {};
  if (str(query)) args.query = str(query);
  if (APPLICATION_STATUSES.has(status as string)) args.status = status;
  if (POSTING_SOURCES.has(source as string)) args.source = source;
  if (PRIORITIES.has(priority as string)) args.priority = priority;
  if (POSTING_STATUSES.has(posting_status as string)) args.posting_status = posting_status;
  const data = await callTool("search_job_postings", args);
  res.json(data);
});

router.get("/networking-queue", async (req, res) => {
  const { networking_status, has_contacts } = req.query;
  const args: Record<string, unknown> = {};
  if (NETWORKING_STATUSES.has(networking_status as string)) args.networking_status = networking_status;
  const hasContactsBool = bool(has_contacts);
  if (hasContactsBool !== undefined) args.has_contacts = hasContactsBool;
  const data = await callTool("get_networking_queue", args);
  res.json(data);
});

router.get("/interviews", async (req, res) => {
  const daysAheadRaw = Number(req.query.days_ahead);
  const args: Record<string, unknown> = {};
  if (Number.isFinite(daysAheadRaw) && daysAheadRaw > 0) args.days_ahead = daysAheadRaw;
  const data = await callTool("get_upcoming_interviews", args);
  res.json(data);
});

router.get("/contacts", async (req, res) => {
  const { query, company_id, role_in_process } = req.query;
  const args: Record<string, unknown> = {};
  if (str(query)) args.query = str(query);
  if (str(company_id)) args.company_id = str(company_id);
  if (CONTACT_ROLES.has(role_in_process as string)) args.role_in_process = role_in_process;
  const data = await callTool("search_job_contacts", args);
  res.json(data);
});
