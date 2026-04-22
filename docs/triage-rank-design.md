# Triage Rank: Stack Ranking Within Priority Tiers

**Status:** Implemented

## Problem

A job pipeline with high/medium/low priority tiers but no ordering within tiers means you have to re-derive "what's next?" every time you sit down to work. This feature adds a numeric rank within each tier so the pipeline can answer that question directly.

## Schema Changes

Two new nullable columns on `job_postings`:

```sql
ALTER TABLE job_postings ADD COLUMN triage_rank integer;
ALTER TABLE job_postings ADD COLUMN triage_reason text;

-- Enforce rank is positive when set
ALTER TABLE job_postings ADD CONSTRAINT chk_triage_rank_positive CHECK (triage_rank >= 1);

-- Rank requires a priority tier
ALTER TABLE job_postings ADD CONSTRAINT chk_triage_rank_needs_priority CHECK (triage_rank IS NULL OR priority IS NOT NULL);

-- Prevent duplicate ranks within the same tier (deferrable so bulk shifts don't hit transient violations)
ALTER TABLE job_postings ADD CONSTRAINT uq_triage_rank_per_tier UNIQUE (priority, triage_rank) DEFERRABLE INITIALLY DEFERRED;
```

- `triage_rank` -- integer, nullable, >= 1. Lower number = higher priority within the same `priority` tier.
- `triage_reason` -- text, nullable. Short explanation of the ranking.

## Auto-Renumber Logic

When `triage_rank` is set, the server shifts existing ranks to make room. All operations run inside a single Postgres RPC transaction.

### Key behaviors:
- **New posting**: Shift all postings in target tier with rank >= new_rank up by 1, then insert
- **Move within tier**: Clear old rank, shift, set new rank
- **Change tier with rank**: Renumber happens in the NEW tier only
- **Change tier without rank**: Rank cleared to null (enters new tier as unranked)
- **Clear rank**: No compaction of gaps
- **Delete**: No compaction of gaps

The Postgres function `set_triage_rank()` handles all rank mutations atomically. See `mcp-server/schema/schema.sql` for the full implementation.

## MCP Server Integration

- `add_job_posting`: accepts optional `triage_rank` and `triage_reason`
- `update_job_posting`: accepts optional `triage_rank` (nullable to clear) and `triage_reason`
- `search_job_postings` and `get_networking_queue`: sort by priority_sort, triage_rank, created_at

## Sort Order

```sql
ALTER TABLE job_postings ADD COLUMN priority_sort integer
  GENERATED ALWAYS AS (
    CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END
  ) STORED;
```

Sort: `priority_sort ASC, triage_rank ASC NULLS LAST, created_at DESC`
