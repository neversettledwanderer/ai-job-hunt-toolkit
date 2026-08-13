import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isStaleWrite, reviewedAssetsMatch } from "./desktop-domain.ts";

export const DESKTOP_CONTRACT_VERSION = "1.1.0";

type ErrorCode =
  | "AUTH_REQUIRED" | "NOT_FOUND" | "VALIDATION_FAILED" | "CONFLICT"
  | "GATE_BLOCKED" | "STALE_WRITE" | "DEPENDENCY_UNAVAILABLE" | "INTERNAL";

const desktopTools = [
  "get_desktop_capabilities", "evaluate_application_readiness", "list_document_assets",
  "register_document_asset", "create_agent_run", "append_agent_run_event",
  "update_agent_run", "record_application_review", "record_gate_override",
  "reconcile_incomplete_agent_runs", "list_desktop_activity",
  "get_latest_application_review", "list_desktop_contacts", "list_desktop_interviews",
  "save_desktop_contact", "delete_desktop_contact", "set_desktop_contact_link",
  "save_desktop_interview", "complete_desktop_interview",
];

function correlationId(): string {
  return crypto.randomUUID();
}

export function desktopSuccess<T extends Record<string, unknown>>(data: T, message = "Operation completed") {
  const envelope = { contractVersion: DESKTOP_CONTRACT_VERSION, correlationId: correlationId(), data };
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ success: true, message, ...data }, null, 2) }],
    structuredContent: envelope,
  };
}

export function desktopFailure(code: ErrorCode, message: string, retriable = false) {
  const error = { code, message, retriable, correlationId: correlationId() };
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error }, null, 2) }],
    structuredContent: { contractVersion: DESKTOP_CONTRACT_VERSION, correlationId: error.correlationId, error },
    isError: true,
  };
}

export function registerDesktopTools(server: McpServer, supabase: SupabaseClient): void {
  server.registerTool(
    "get_desktop_capabilities",
    { title: "Desktop Capabilities", description: "Return the desktop service contract version and safe feature capabilities.", inputSchema: {} },
    async () => desktopSuccess({ contractVersion: DESKTOP_CONTRACT_VERSION, tools: desktopTools }, "Desktop contract available"),
  );

  server.registerTool(
    "evaluate_application_readiness",
    {
      title: "Evaluate Application Readiness",
      description: "Calculate readiness from canonical posting, application, document, networking, and review state.",
      inputSchema: { application_id: z.string().uuid() },
    },
    async ({ application_id }) => {
      try {
        const { data: application, error: appError } = await supabase
          .from("applications")
          .select("*, job_postings!inner(id, status, priority, triage_rank, networking_status)")
          .eq("id", application_id)
          .single();
        if (appError || !application) return desktopFailure("NOT_FOUND", "Application not found.");

        const [{ data: assets, error: assetError }, { data: reviews, error: reviewError }, { data: overrides, error: overrideError }] = await Promise.all([
          supabase.from("document_assets").select("id, asset_type, content_hash, validation_state").eq("application_id", application_id),
          supabase.from("application_reviews").select("*").eq("application_id", application_id).order("reviewed_at", { ascending: false }).limit(1),
          supabase.from("gate_overrides").select("gate_ids").eq("application_id", application_id),
        ]);
        if (assetError || reviewError || overrideError) return desktopFailure("INTERNAL", "Readiness records could not be loaded.", true);

        const posting = Array.isArray(application.job_postings) ? application.job_postings[0] : application.job_postings;
        const usableAssets = (assets ?? []).filter((asset) => asset.validation_state !== "invalid");
        const hasIndexedResume = (assets ?? []).some((asset) => asset.asset_type === "resume");
        const hasIndexedCoverLetter = (assets ?? []).some((asset) => asset.asset_type === "cover_letter");
        const resumeExists = usableAssets.some((asset) => asset.asset_type === "resume") || (!hasIndexedResume && Boolean(application.resume_path));
        const coverLetterExists = usableAssets.some((asset) => asset.asset_type === "cover_letter") || (!hasIndexedCoverLetter && Boolean(application.cover_letter_path));
        const review = reviews?.[0];
        const packageAssets = (assets ?? []).filter((asset) => ["resume", "cover_letter"].includes(asset.asset_type));
        const currentHashes = Object.fromEntries(packageAssets.map((asset) => [asset.id, asset.content_hash]));
        const reviewedHashes = review?.reviewed_asset_hashes && typeof review.reviewed_asset_hashes === "object"
          ? review.reviewed_asset_hashes as Record<string, string>
          : {};
        const reviewFresh = Boolean(review) && reviewedAssetsMatch(reviewedHashes, currentHashes);

        const overridden = new Set((overrides ?? []).flatMap((item) => item.gate_ids ?? []));
        const gates = [
          gate("posting_active", "Posting is active", posting.status === "active", "The posting is closed.", "Review posting"),
          gate("triaged", "Role is triaged", Boolean(posting.priority && posting.triage_rank), "Set a priority and rank.", "Triage role"),
          gate("resume", "Tailored resume attached", resumeExists, "Create or attach a tailored resume.", "Tailor resume"),
          gate("networking", "Networking started", ["outreach_in_progress", "done"].includes(posting.networking_status), "Research contacts and begin outreach.", "Open networking"),
          gate("cover_letter", "Required cover letter attached", !application.cover_letter_required || coverLetterExists, "Attach the required cover letter.", "Attach cover letter"),
          gate("review", "Application review passed", review?.result === "pass", "Run the independent package review.", "Review package"),
          gate("review_fresh", "Review matches current files", reviewFresh, "Files changed after the review.", "Re-run review"),
        ];
        const effectiveGates = gates.map((item) => item.passed || !overridden.has(item.id) ? item : { ...item, overridden: true });
        return desktopSuccess({
          applicationId: application_id,
          ready: effectiveGates.every((item) => item.passed || ("overridden" in item && item.overridden)),
          evaluatedAt: new Date().toISOString(),
          gates: effectiveGates,
        });
      } catch (error) {
        return desktopFailure("INTERNAL", error instanceof Error ? error.message : String(error), true);
      }
    },
  );

  server.registerTool(
    "list_document_assets",
    {
      title: "List Document Assets",
      description: "List structured document metadata without returning document contents.",
      inputSchema: {
        application_id: z.string().uuid().optional(),
        job_posting_id: z.string().uuid().optional(),
        asset_type: z.enum(["master_resume", "resume", "cover_letter", "job_description", "review", "other"]).optional(),
      },
    },
    async ({ application_id, job_posting_id, asset_type }) => {
      let query = supabase.from("document_assets").select("*").order("modified_at", { ascending: false });
      if (application_id) query = query.eq("application_id", application_id);
      if (job_posting_id) query = query.eq("job_posting_id", job_posting_id);
      if (asset_type) query = query.eq("asset_type", asset_type);
      const { data, error } = await query;
      return error ? desktopFailure("INTERNAL", "Document assets could not be loaded.", true) : desktopSuccess({ assets: data ?? [] });
    },
  );

  server.registerTool(
    "register_document_asset",
    {
      title: "Register Document Asset",
      description: "Create or update safe metadata for a file inside the approved desktop workspace.",
      inputSchema: {
        id: z.string().uuid().optional(),
        application_id: z.string().uuid().nullable().optional(),
        job_posting_id: z.string().uuid().nullable().optional(),
        asset_type: z.enum(["master_resume", "resume", "cover_letter", "job_description", "review", "other"]),
        relative_path: z.string().min(1).refine((value) => !value.startsWith("/") && !value.split("/").includes("..")),
        content_hash: z.string().regex(/^[a-f0-9]{64}$/),
        modified_at: z.string().datetime(),
        created_by_run: z.string().uuid().nullable().optional(),
        created_by: z.string().min(1).max(200).default("desktop-user"),
        validation_state: z.enum(["pending", "valid", "warning", "invalid"]).default("pending"),
      },
    },
    async (input) => {
      const row = { ...input, id: input.id ?? crypto.randomUUID() };
      const { data, error } = await supabase.from("document_assets").upsert(row, { onConflict: "relative_path" }).select().single();
      if (error) return desktopFailure("INTERNAL", "Document asset could not be registered.", true);
      const { error: attributionError } = await supabase.from("attribution_log").insert({
        entity_type: "document_asset", entity_id: data.id, action: "registered",
        actor: input.created_by, reason: `Registered ${input.asset_type}`,
      });
      return attributionError ? desktopFailure("INTERNAL", "Document registered but attribution could not be recorded.", true) : desktopSuccess({ asset: data }, "Document registered");
    },
  );

  server.registerTool(
    "create_agent_run",
    {
      title: "Create Agent Run",
      description: "Persist a new desktop workflow run before worker execution.",
      inputSchema: {
        run_id: z.string().uuid(), workflow: z.enum(["resume", "review"]),
        entity_type: z.enum(["job_posting", "application", "workspace"]), entity_id: z.string().uuid().nullable().optional(),
      },
    },
    async ({ run_id, workflow, entity_type, entity_id }) => {
      const { data, error } = await supabase.from("agent_runs").insert({ id: run_id, workflow, entity_type, entity_id: entity_id ?? null, status: "queued" }).select().single();
      if (error) return desktopFailure("INTERNAL", "Agent run could not be created.", true);
      const { error: attributionError } = await supabase.from("attribution_log").insert({ entity_type: "agent_run", entity_id: run_id, action: "created", actor: "desktop-agent", reason: `Started ${workflow}` });
      return attributionError ? desktopFailure("INTERNAL", "Run created but attribution could not be recorded.", true) : desktopSuccess({ run: data }, "Run created");
    },
  );

  server.registerTool(
    "append_agent_run_event",
    {
      title: "Append Agent Run Event",
      description: "Append one safe lifecycle event in sequence.",
      inputSchema: { run_id: z.string().uuid(), sequence: z.number().int().min(1), event_type: z.string().min(1).max(100), safe_payload: z.record(z.string(), z.unknown()).default({}) },
    },
    async (input) => {
      const { data, error } = await supabase.from("agent_run_events").insert(input).select().single();
      return error ? desktopFailure(error.code === "23505" ? "CONFLICT" : "INTERNAL", "Run event could not be appended.", error.code !== "23505") : desktopSuccess({ event: data });
    },
  );

  server.registerTool(
    "update_agent_run",
    {
      title: "Update Agent Run",
      description: "Materialise the current run state after an append-only event is recorded.",
      inputSchema: {
        run_id: z.string().uuid(),
        status: z.enum(["queued", "running", "waiting_for_input", "waiting_for_approval", "completed", "failed", "cancelled", "interrupted"]),
        session_id: z.string().nullable().optional(), error_code: z.string().nullable().optional(), error_summary: z.string().max(2000).nullable().optional(),
        usage: z.record(z.string(), z.unknown()).nullable().optional(), writes_occurred: z.boolean().optional(),
      },
    },
    async ({ run_id, status, ...fields }) => {
      const terminal = ["completed", "failed", "cancelled", "interrupted"].includes(status);
      const { data, error } = await supabase.from("agent_runs").update({ ...fields, status, finished_at: terminal ? new Date().toISOString() : null }).eq("id", run_id).select().single();
      return error ? desktopFailure("INTERNAL", "Agent run could not be updated.", true) : desktopSuccess({ run: data });
    },
  );

  server.registerTool(
    "reconcile_incomplete_agent_runs",
    {
      title: "Reconcile Incomplete Agent Runs",
      description: "Mark runs left active by a prior desktop process as interrupted and return retryable run identifiers.",
      inputSchema: {},
    },
    async () => {
      const active = ["queued", "running", "waiting_for_input", "waiting_for_approval"];
      const { data: rows, error: findError } = await supabase.from("agent_runs").select("id").in("status", active);
      if (findError) return desktopFailure("INTERNAL", "Incomplete runs could not be reconciled.", true);
      const ids = (rows ?? []).map((row) => row.id);
      if (ids.length) {
        const { error } = await supabase.from("agent_runs").update({
          status: "interrupted",
          error_code: "PROCESS_RESTARTED",
          error_summary: "The desktop app stopped before this run completed. Retry the workflow.",
          finished_at: new Date().toISOString(),
        }).in("id", ids);
        if (error) return desktopFailure("INTERNAL", "Incomplete runs could not be reconciled.", true);
      }
      return desktopSuccess({ interruptedRunIds: ids }, ids.length ? "Incomplete runs marked interrupted" : "No incomplete runs");
    },
  );

  server.registerTool(
    "get_latest_application_review",
    {
      title: "Latest Application Review",
      description: "Return the latest structured review for one application without document contents.",
      inputSchema: { application_id: z.string().uuid() },
    },
    async ({ application_id }) => {
      const { data, error } = await supabase.from("application_reviews").select("*").eq("application_id", application_id).order("reviewed_at", { ascending: false }).limit(1).maybeSingle();
      return error ? desktopFailure("INTERNAL", "Application review could not be loaded.", true) : desktopSuccess({ review: data ?? null });
    },
  );

  server.registerTool(
    "list_desktop_contacts",
    {
      title: "List Desktop Contacts",
      description: "List contacts with their posting relationships for desktop contact management.",
      inputSchema: { query: z.string().max(200).optional(), limit: z.number().int().min(1).max(200).default(100) },
    },
    async ({ query, limit }) => {
      let request = supabase.from("job_contacts")
        .select("*, companies(name), posting_contacts(job_posting_id, relationship, job_postings(id, title, companies(name)))")
        .order("created_at", { ascending: false }).limit(limit);
      if (query) {
        const safeQuery = query.replace(/[%_.,()\\]/g, "\\$&");
        request = request.or(`name.ilike.%${safeQuery}%,title.ilike.%${safeQuery}%,notes.ilike.%${safeQuery}%`);
      }
      const { data, error } = await request;
      return error ? desktopFailure("INTERNAL", "Contacts could not be loaded.", true) : desktopSuccess({ contacts: data ?? [] });
    },
  );

  server.registerTool(
    "list_desktop_interviews",
    {
      title: "List Desktop Interviews",
      description: "List upcoming and historical interviews with application and posting context.",
      inputSchema: { limit: z.number().int().min(1).max(200).default(100) },
    },
    async ({ limit }) => {
      const { data, error } = await supabase.from("interviews")
        .select("*, applications(id, job_posting_id, job_postings(id, title, companies(name)))")
        .order("scheduled_at", { ascending: false, nullsFirst: false }).limit(limit);
      return error ? desktopFailure("INTERNAL", "Interviews could not be loaded.", true) : desktopSuccess({ interviews: data ?? [] });
    },
  );

  server.registerTool(
    "list_desktop_activity",
    {
      title: "List Desktop Activity",
      description: "Return redacted mutation, workflow, review, and gate-override activity for the desktop audit view.",
      inputSchema: { limit: z.number().int().min(1).max(200).default(100) },
    },
    async ({ limit }) => {
      const [attribution, runs, reviews, overrides] = await Promise.all([
        supabase.from("attribution_log").select("id, entity_type, entity_id, action, actor, reason, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("agent_runs").select("id, entity_type, entity_id, workflow, status, error_code, error_summary, started_at, finished_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("application_reviews").select("id, application_id, result, safe_summary, reviewer_run_id, reviewed_at").order("reviewed_at", { ascending: false }).limit(limit),
        supabase.from("gate_overrides").select("id, application_id, gate_ids, reason, actor, created_at").order("created_at", { ascending: false }).limit(limit),
      ]);
      const error = attribution.error ?? runs.error ?? reviews.error ?? overrides.error;
      if (error) return desktopFailure("INTERNAL", "Activity could not be loaded.", true);
      return desktopSuccess({
        attribution: attribution.data ?? [],
        runs: runs.data ?? [],
        reviews: reviews.data ?? [],
        overrides: overrides.data ?? [],
      });
    },
  );

  server.registerTool(
    "save_desktop_contact",
    {
      title: "Save Desktop Contact",
      description: "Create or update a contact with optimistic concurrency and attribution.",
      inputSchema: {
        contact_id: z.string().uuid().optional(), name: z.string().trim().min(1).max(200),
        company_id: z.string().uuid().nullable().optional(), title: z.string().max(200).nullable().optional(),
        email: z.string().email().nullable().optional(), phone: z.string().max(100).nullable().optional(),
        linkedin_url: z.string().url().nullable().optional(),
        role_in_process: z.enum(["recruiter", "hiring_manager", "referral", "interviewer", "other"]).nullable().optional(),
        notes: z.string().max(10000).nullable().optional(), last_contacted: z.string().datetime().nullable().optional(),
        expected_updated_at: z.string().datetime().optional(), idempotency_key: z.string().uuid(), actor: z.string().min(1),
      },
    },
    async ({ contact_id, expected_updated_at, idempotency_key, actor, ...fields }) => {
      const { data: prior } = await supabase.from("mutation_idempotency").select("result").eq("idempotency_key", idempotency_key).maybeSingle();
      if (prior?.result) return desktopSuccess(prior.result as Record<string, unknown>, "Contact save already completed");
      let contact;
      if (contact_id) {
        const { data: current, error: currentError } = await supabase.from("job_contacts").select("updated_at").eq("id", contact_id).single();
        if (currentError || !current) return desktopFailure("NOT_FOUND", "Contact not found.");
        if (isStaleWrite(expected_updated_at, current.updated_at)) return desktopFailure("STALE_WRITE", "The contact changed after it was opened. Refresh before saving.");
        let update = supabase.from("job_contacts").update(fields).eq("id", contact_id);
        if (expected_updated_at) update = update.eq("updated_at", expected_updated_at);
        const { data, error } = await update.select().single();
        if (error) return desktopFailure(error.code === "PGRST116" ? "STALE_WRITE" : "INTERNAL", "Contact could not be updated.", error.code !== "PGRST116");
        contact = data;
      } else {
        const { data, error } = await supabase.from("job_contacts").insert(fields).select().single();
        if (error) return desktopFailure("INTERNAL", "Contact could not be created.", true);
        contact = data;
      }
      const result = { contact };
      await Promise.all([
        supabase.from("attribution_log").insert({ entity_type: "job_contact", entity_id: contact.id, action: contact_id ? "updated" : "created", actor, reason: "Saved in desktop app" }),
        supabase.from("mutation_idempotency").insert({ idempotency_key, operation: "save_desktop_contact", result }),
      ]);
      return desktopSuccess(result, contact_id ? "Contact updated" : "Contact created");
    },
  );

  server.registerTool(
    "delete_desktop_contact",
    {
      title: "Delete Desktop Contact", description: "Delete a contact and its posting links with attribution.",
      inputSchema: { contact_id: z.string().uuid(), actor: z.string().min(1) },
    },
    async ({ contact_id, actor }) => {
      const { data: current, error: findError } = await supabase.from("job_contacts").select("id, name").eq("id", contact_id).single();
      if (findError || !current) return desktopFailure("NOT_FOUND", "Contact not found.");
      const { error } = await supabase.from("job_contacts").delete().eq("id", contact_id);
      if (error) return desktopFailure("INTERNAL", "Contact could not be deleted.", true);
      await supabase.from("attribution_log").insert({ entity_type: "job_contact", entity_id: contact_id, action: "deleted", actor, reason: `Deleted contact: ${current.name}` });
      return desktopSuccess({ contactId: contact_id }, "Contact deleted");
    },
  );

  server.registerTool(
    "set_desktop_contact_link",
    {
      title: "Set Desktop Contact Link", description: "Link or unlink a contact and posting with a relationship type.",
      inputSchema: {
        contact_id: z.string().uuid(), job_posting_id: z.string().uuid(), linked: z.boolean(), actor: z.string().min(1),
        relationship: z.enum(["colleague", "hiring_manager", "confirmed_recruiter", "recruiter", "recruiting_lead", "network", "mutual_intro", "employee", "executive"]).optional(),
      },
    },
    async ({ contact_id, job_posting_id, linked, relationship, actor }) => {
      if (linked && !relationship) return desktopFailure("VALIDATION_FAILED", "A relationship is required when linking a contact.");
      const operation = linked
        ? supabase.from("posting_contacts").upsert({ job_contact_id: contact_id, job_posting_id, relationship }, { onConflict: "job_posting_id,job_contact_id" })
        : supabase.from("posting_contacts").delete().eq("job_contact_id", contact_id).eq("job_posting_id", job_posting_id);
      const { error } = await operation;
      if (error) return desktopFailure("INTERNAL", linked ? "Contact could not be linked." : "Contact could not be unlinked.", true);
      await supabase.from("attribution_log").insert({ entity_type: "job_contact", entity_id: contact_id, action: linked ? "linked_to_posting" : "unlinked_from_posting", actor, reason: `Posting ${job_posting_id}` });
      return desktopSuccess({ contactId: contact_id, postingId: job_posting_id, linked }, linked ? "Contact linked" : "Contact unlinked");
    },
  );

  server.registerTool(
    "save_desktop_interview",
    {
      title: "Save Desktop Interview", description: "Schedule or edit an interview with optimistic concurrency and attribution.",
      inputSchema: {
        interview_id: z.string().uuid().optional(), application_id: z.string().uuid(),
        interview_type: z.enum(["phone_screen", "technical", "behavioral", "system_design", "hiring_manager", "team", "final"]),
        scheduled_at: z.string().datetime().nullable().optional(), duration_minutes: z.number().int().min(5).max(720).nullable().optional(),
        interviewer_name: z.string().max(200).nullable().optional(), notes: z.string().max(10000).nullable().optional(),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
        expected_updated_at: z.string().datetime().optional(), idempotency_key: z.string().uuid(), actor: z.string().min(1),
      },
    },
    async ({ interview_id, expected_updated_at, idempotency_key, actor, ...fields }) => {
      const { data: prior } = await supabase.from("mutation_idempotency").select("result").eq("idempotency_key", idempotency_key).maybeSingle();
      if (prior?.result) return desktopSuccess(prior.result as Record<string, unknown>, "Interview save already completed");
      let interview;
      if (interview_id) {
        const { data: current, error: findError } = await supabase.from("interviews").select("updated_at").eq("id", interview_id).single();
        if (findError || !current) return desktopFailure("NOT_FOUND", "Interview not found.");
        if (isStaleWrite(expected_updated_at, current.updated_at)) return desktopFailure("STALE_WRITE", "The interview changed after it was opened. Refresh before saving.");
        let update = supabase.from("interviews").update(fields).eq("id", interview_id);
        if (expected_updated_at) update = update.eq("updated_at", expected_updated_at);
        const { data, error } = await update.select().single();
        if (error) return desktopFailure("INTERNAL", "Interview could not be updated.", true);
        interview = data;
      } else {
        const { data, error } = await supabase.from("interviews").insert({ ...fields, status: fields.status ?? "scheduled" }).select().single();
        if (error) return desktopFailure("INTERNAL", "Interview could not be scheduled.", true);
        interview = data;
      }
      const result = { interview };
      await Promise.all([
        supabase.from("attribution_log").insert({ entity_type: "interview", entity_id: interview.id, action: interview_id ? "updated" : "created", actor, reason: "Saved in desktop app" }),
        supabase.from("mutation_idempotency").insert({ idempotency_key, operation: "save_desktop_interview", result }),
      ]);
      return desktopSuccess(result, interview_id ? "Interview updated" : "Interview scheduled");
    },
  );

  server.registerTool(
    "complete_desktop_interview",
    {
      title: "Complete Desktop Interview", description: "Mark an interview completed with optimistic concurrency and attribution.",
      inputSchema: { interview_id: z.string().uuid(), expected_updated_at: z.string().datetime().optional(), actor: z.string().min(1) },
    },
    async ({ interview_id, expected_updated_at, actor }) => {
      let update = supabase.from("interviews").update({ status: "completed" }).eq("id", interview_id);
      if (expected_updated_at) update = update.eq("updated_at", expected_updated_at);
      const { data, error } = await update.select().single();
      if (error || !data) return desktopFailure(expected_updated_at ? "STALE_WRITE" : "NOT_FOUND", expected_updated_at ? "The interview changed after it was opened." : "Interview not found.");
      await supabase.from("attribution_log").insert({ entity_type: "interview", entity_id: interview_id, action: "completed", actor, reason: "Marked completed in desktop app" });
      return desktopSuccess({ interview: data }, "Interview completed");
    },
  );

  server.registerTool(
    "record_application_review",
    {
      title: "Record Application Review",
      description: "Store a structured independent review tied to exact asset hashes.",
      inputSchema: {
        application_id: z.string().uuid(), result: z.enum(["pass", "fail"]),
        reviewed_asset_hashes: z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)),
        findings: z.object({ must_fix: z.array(z.unknown()), interview_prep: z.array(z.unknown()), minor: z.array(z.unknown()) }),
        safe_summary: z.string().max(5000).optional(), reviewer_run_id: z.string().uuid().nullable().optional(),
      },
    },
    async (input) => {
      const { data, error } = await supabase.from("application_reviews").insert(input).select().single();
      if (error) return desktopFailure("INTERNAL", "Application review could not be recorded.", true);
      const { error: attributionError } = await supabase.from("attribution_log").insert({ entity_type: "application_review", entity_id: data.id, action: `review_${input.result}`, actor: `desktop-agent:${input.reviewer_run_id ?? "review"}`, reason: input.safe_summary ?? "Application reviewed" });
      return attributionError ? desktopFailure("INTERNAL", "Review recorded but attribution could not be recorded.", true) : desktopSuccess({ review: data }, "Review recorded");
    },
  );

  server.registerTool(
    "record_gate_override",
    {
      title: "Record Gate Override",
      description: "Record an explicit acknowledged readiness override before manual application.",
      inputSchema: {
        application_id: z.string().uuid(), gate_ids: z.array(z.string()).min(1),
        reason: z.string().trim().min(10).max(2000), acknowledged: z.literal(true), actor: z.string().min(1),
      },
    },
    async (input) => {
      const { data, error } = await supabase.from("gate_overrides").insert(input).select().single();
      if (error) return desktopFailure("INTERNAL", "Gate override could not be recorded.", true);
      const { error: attributionError } = await supabase.from("attribution_log").insert({ entity_type: "gate_override", entity_id: data.id, action: "gate_overridden", actor: input.actor, reason: input.reason });
      return attributionError ? desktopFailure("INTERNAL", "Override recorded but attribution could not be recorded.", true) : desktopSuccess({ override: data }, "Override recorded");
    },
  );
}

function gate(id: string, label: string, passed: boolean, reason: string, action: string) {
  return passed ? { id, label, passed } : { id, label, passed, reason, action };
}
