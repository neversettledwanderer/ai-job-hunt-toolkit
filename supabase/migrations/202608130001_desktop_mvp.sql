-- Forward-only compatibility schema for AI Job Hunt Desktop 0.1.
-- Existing CLI fields remain in place while structured desktop records are added.

BEGIN;

ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE job_contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter_required BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM applications GROUP BY job_posting_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add one-application-per-posting constraint: duplicate applications exist';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_job_posting
  ON applications(job_posting_id);

-- Desktop ranking uses one transactional RPC that locks the target row,
-- validates the renderer's optimistic-concurrency token, shifts neighbouring
-- ranks, and updates the selected posting before returning.
CREATE OR REPLACE FUNCTION set_triage_rank_desktop(
  p_posting_id UUID,
  p_new_rank INTEGER,
  p_new_priority TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS job_postings
LANGUAGE plpgsql
AS $$
DECLARE
  v_posting job_postings%ROWTYPE;
  v_resolved_priority TEXT;
  v_resolved_reason TEXT;
  v_max_rank INTEGER;
BEGIN
  SELECT * INTO v_posting FROM job_postings WHERE id = p_posting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Posting not found'; END IF;
  IF p_expected_updated_at IS NOT NULL AND v_posting.updated_at <> p_expected_updated_at THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'Posting changed after it was opened';
  END IF;

  v_resolved_priority := CASE
    WHEN p_new_priority IS NULL THEN v_posting.priority::TEXT
    WHEN p_new_priority = '' THEN NULL
    ELSE p_new_priority
  END;
  v_resolved_reason := CASE
    WHEN p_reason IS NULL THEN v_posting.triage_reason
    WHEN p_reason = '' THEN NULL
    ELSE p_reason
  END;

  IF p_new_rank IS NULL THEN
    UPDATE job_postings SET triage_rank = NULL, triage_reason = v_resolved_reason, priority = v_resolved_priority
      WHERE id = p_posting_id RETURNING * INTO v_posting;
    RETURN v_posting;
  END IF;

  SELECT COALESCE(MAX(triage_rank), 0) INTO v_max_rank
    FROM job_postings WHERE priority::TEXT = v_resolved_priority AND id <> p_posting_id;
  p_new_rank := LEAST(p_new_rank, v_max_rank + 1);
  UPDATE job_postings SET triage_rank = NULL WHERE id = p_posting_id;
  UPDATE job_postings SET triage_rank = triage_rank + 1
    WHERE priority::TEXT = v_resolved_priority AND triage_rank >= p_new_rank AND id <> p_posting_id;
  UPDATE job_postings SET triage_rank = p_new_rank, priority = v_resolved_priority, triage_reason = v_resolved_reason
    WHERE id = p_posting_id RETURNING * INTO v_posting;
  RETURN v_posting;
END;
$$;

REVOKE ALL ON FUNCTION set_triage_rank_desktop(UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION set_triage_rank_desktop(UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION set_triage_rank_desktop(UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ) TO service_role;

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  workflow TEXT NOT NULL CHECK (workflow IN ('resume', 'review')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('job_posting', 'application', 'workspace')),
  entity_id UUID,
  status TEXT NOT NULL CHECK (status IN (
    'queued', 'running', 'waiting_for_input', 'waiting_for_approval',
    'completed', 'failed', 'cancelled', 'interrupted'
  )),
  session_id TEXT,
  error_code TEXT,
  error_summary TEXT,
  usage JSONB,
  writes_occurred BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_run_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  event_type TEXT NOT NULL,
  safe_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, sequence)
);

CREATE TABLE IF NOT EXISTS document_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'master_resume', 'resume', 'cover_letter', 'job_description', 'review', 'other'
  )),
  relative_path TEXT NOT NULL CHECK (
    relative_path <> '' AND
    relative_path !~ '(^|/)\.\.(/|$)' AND
    relative_path !~ '^/'
  ),
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  modified_at TIMESTAMPTZ NOT NULL,
  created_by_run UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL DEFAULT 'desktop-user',
  validation_state TEXT NOT NULL DEFAULT 'pending' CHECK (
    validation_state IN ('pending', 'valid', 'warning', 'invalid')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (relative_path)
);

CREATE TABLE IF NOT EXISTS application_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('pass', 'fail')),
  reviewed_asset_hashes JSONB NOT NULL,
  findings JSONB NOT NULL DEFAULT '{"must_fix":[],"interview_prep":[],"minor":[]}'::jsonb,
  safe_summary TEXT,
  reviewer_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gate_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  gate_ids TEXT[] NOT NULL CHECK (cardinality(gate_ids) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) >= 10),
  acknowledged BOOLEAN NOT NULL CHECK (acknowledged),
  actor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mutation_idempotency (
  idempotency_key UUID PRIMARY KEY,
  operation TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_entity ON agent_runs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_run_events_run ON agent_run_events(run_id, sequence);
CREATE INDEX IF NOT EXISTS idx_document_assets_application ON document_assets(application_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_document_assets_posting ON document_assets(job_posting_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_application_reviews_latest ON application_reviews(application_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_overrides_application ON gate_overrides(application_id, created_at DESC);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_run_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutation_idempotency ENABLE ROW LEVEL SECURITY;

-- No client-facing policies are created for these personal-mode tables. The
-- authenticated MCP Edge Function uses the service role and bypasses RLS.

DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_job_contacts_updated_at ON job_contacts;
CREATE TRIGGER update_job_contacts_updated_at BEFORE UPDATE ON job_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_agent_runs_updated_at ON agent_runs;
CREATE TRIGGER update_agent_runs_updated_at BEFORE UPDATE ON agent_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_document_assets_updated_at ON document_assets;
CREATE TRIGGER update_document_assets_updated_at BEFORE UPDATE ON document_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
