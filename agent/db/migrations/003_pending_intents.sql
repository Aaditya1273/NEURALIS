-- Migration 003: user intent queue
-- The frontend writes here; the agent reads and clears on each cycle.

CREATE TABLE IF NOT EXISTS pending_intents (
    id            SERIAL PRIMARY KEY,
    owner_address TEXT        NOT NULL DEFAULT 'anonymous',
    intent_text   TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at   TIMESTAMPTZ,          -- set by agent when processed
    cycle_id      INT                   -- rebalance_history.id that consumed it
);

CREATE INDEX IF NOT EXISTS idx_pending_intents_unconsumed
    ON pending_intents (created_at DESC)
    WHERE consumed_at IS NULL;
