-- job_postings.triaged_at has existed since the desktop schema (schema.sql) but nothing
-- ever wrote to it: set_triage_rank / set_triage_rank_desktop only touched
-- priority/triage_rank/triage_reason, so every triaged posting still reads triaged_at IS NULL
-- forever. Stamp it as a side effect of recording a triage decision (priority or reason
-- resolving to non-null), mirroring the NULL = untriaged comment on the column itself.

CREATE OR REPLACE FUNCTION public.set_triage_rank(p_posting_id uuid, p_new_rank integer, p_new_priority text DEFAULT NULL::text, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_current_priority text;
  v_current_rank integer;
  v_effective_priority text;
  v_resolved_priority text;
  v_resolved_reason text;
  v_max_rank integer;
  v_triaged_at timestamptz;
BEGIN
  SELECT priority, triage_rank, triage_reason INTO v_current_priority, v_current_rank, v_resolved_reason
  FROM job_postings WHERE id = p_posting_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Posting % not found', p_posting_id;
  END IF;

  v_resolved_priority := CASE
    WHEN p_new_priority IS NULL THEN v_current_priority
    WHEN p_new_priority = '' THEN NULL
    ELSE p_new_priority
  END;
  v_resolved_reason := CASE
    WHEN p_reason IS NULL THEN v_resolved_reason
    WHEN p_reason = '' THEN NULL
    ELSE p_reason
  END;
  v_effective_priority := v_resolved_priority;
  v_triaged_at := CASE WHEN v_resolved_priority IS NOT NULL OR v_resolved_reason IS NOT NULL THEN now() ELSE NULL END;

  IF p_new_rank IS NULL THEN
    UPDATE job_postings SET triage_rank = NULL, triage_reason = v_resolved_reason, priority = v_resolved_priority, triaged_at = v_triaged_at WHERE id = p_posting_id;
    RETURN;
  END IF;

  SELECT COALESCE(MAX(triage_rank), 0) INTO v_max_rank
  FROM job_postings WHERE priority = v_effective_priority AND id != p_posting_id;

  IF p_new_rank > v_max_rank + 1 THEN
    p_new_rank := v_max_rank + 1;
  END IF;

  UPDATE job_postings SET triage_rank = NULL WHERE id = p_posting_id;
  UPDATE job_postings SET triage_rank = triage_rank + 1
  WHERE priority = v_effective_priority AND triage_rank >= p_new_rank AND id != p_posting_id;
  UPDATE job_postings SET triage_rank = p_new_rank, priority = v_resolved_priority, triage_reason = v_resolved_reason, triaged_at = v_triaged_at WHERE id = p_posting_id;
END;
$function$;

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
  v_triaged_at TIMESTAMPTZ;
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
  v_triaged_at := CASE WHEN v_resolved_priority IS NOT NULL OR v_resolved_reason IS NOT NULL THEN now() ELSE NULL END;

  IF p_new_rank IS NULL THEN
    UPDATE job_postings SET triage_rank = NULL, triage_reason = v_resolved_reason, priority = v_resolved_priority, triaged_at = v_triaged_at
      WHERE id = p_posting_id RETURNING * INTO v_posting;
    RETURN v_posting;
  END IF;

  SELECT COALESCE(MAX(triage_rank), 0) INTO v_max_rank
    FROM job_postings WHERE priority::TEXT = v_resolved_priority AND id <> p_posting_id;
  p_new_rank := LEAST(p_new_rank, v_max_rank + 1);
  UPDATE job_postings SET triage_rank = NULL WHERE id = p_posting_id;
  UPDATE job_postings SET triage_rank = triage_rank + 1
    WHERE priority::TEXT = v_resolved_priority AND triage_rank >= p_new_rank AND id <> p_posting_id;
  UPDATE job_postings SET triage_rank = p_new_rank, priority = v_resolved_priority, triage_reason = v_resolved_reason, triaged_at = v_triaged_at
    WHERE id = p_posting_id RETURNING * INTO v_posting;
  RETURN v_posting;
END;
$$;

-- Backfill: postings that already carry a triage verdict (priority or triage_reason set)
-- but predate this fix get stamped now rather than staying permanently invisible to any
-- future triaged_at IS NULL query.
UPDATE job_postings
SET triaged_at = now()
WHERE triaged_at IS NULL
  AND (priority IS NOT NULL OR triage_reason IS NOT NULL);
