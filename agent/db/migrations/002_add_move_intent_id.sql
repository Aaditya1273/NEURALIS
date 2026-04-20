-- Migration 002: add MoveVM intent_id to rebalance_history
-- and create a labor_badge_log table for local tracking.

ALTER TABLE rebalance_history
    ADD COLUMN IF NOT EXISTS intent_id BIGINT;   -- NULL when MoveVM is not configured

COMMENT ON COLUMN rebalance_history.intent_id IS
    'ProgrammableIntents intent_id on the NEURALIS MoveVM (NULL if MoveVM not configured)';

-- ── Labor badge event log ─────────────────────────────────────────────────────
-- Mirrors the on-chain BadgeMintedEvent / BadgeLeveledUpEvent for fast queries.

CREATE TABLE IF NOT EXISTS labor_badge_log (
    id           SERIAL PRIMARY KEY,
    logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner        TEXT        NOT NULL,   -- init1... bech32 address
    badge_type   SMALLINT    NOT NULL,   -- 0-3
    event_type   TEXT        NOT NULL,   -- 'minted' | 'leveled_up'
    old_level    INT,                    -- NULL for minted events
    new_level    INT         NOT NULL,
    tx_hash      TEXT,
    block_height BIGINT
);

CREATE INDEX IF NOT EXISTS idx_labor_badge_log_owner
    ON labor_badge_log (owner, badge_type);

CREATE INDEX IF NOT EXISTS idx_labor_badge_log_logged_at
    ON labor_badge_log (logged_at DESC);
