-- Attribute every new desktop AI workflow to its selected vendor and pinned model.
-- Existing Anthropic-only runs remain valid with NULL attribution.
ALTER TABLE agent_runs
  ADD COLUMN IF NOT EXISTS ai_provider TEXT,
  ADD COLUMN IF NOT EXISTS ai_model TEXT;

ALTER TABLE agent_runs
  DROP CONSTRAINT IF EXISTS agent_runs_ai_provider_check;

ALTER TABLE agent_runs
  ADD CONSTRAINT agent_runs_ai_provider_check
  CHECK (ai_provider IS NULL OR ai_provider IN ('openai', 'anthropic', 'google'));

COMMENT ON COLUMN agent_runs.ai_provider IS 'AI vendor selected by the desktop workflow registry.';
COMMENT ON COLUMN agent_runs.ai_model IS 'Pinned provider model identifier used by this run.';
