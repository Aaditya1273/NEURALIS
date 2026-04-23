'use strict';

require('dotenv').config();

const cron           = require('node-cron');
const { ethers }     = require('ethers');
const { Pool }       = require('pg');

const { collect }   = require('./src/collector');
const { score }     = require('./src/scorer');
const { recommend } = require('./src/recommender');
const { execute }   = require('./src/executor');

// ── Validate required env vars ────────────────────────────────────────────────

const REQUIRED_ENV = [
  'RPC_URL',
  'VAULT_MANAGER_ADDRESS',
  'STRATEGY_REGISTRY_ADDRESS',
  'KEEPER_EXECUTOR_ADDRESS',
  'KEEPER_PRIVATE_KEY',
  'GROQ_API_KEY',
  'DATABASE_URL',
];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required env var: ${key}`);
    process.exit(1);
  }
}

// ── Shared singletons ─────────────────────────────────────────────────────────

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const db       = new Pool({ connectionString: process.env.DATABASE_URL });

const INTERVAL_MINUTES = Number(process.env.CRON_INTERVAL_MINUTES ?? 30);
const CRON_EXPRESSION  = `*/${INTERVAL_MINUTES} * * * *`;

// ── Fetch and consume pending user intents ────────────────────────────────────

async function fetchPendingIntents() {
  try {
    const { rows } = await db.query(
      `SELECT id, intent_text FROM pending_intents
       WHERE consumed_at IS NULL
       ORDER BY created_at ASC
       LIMIT 10`
    );
    return rows;
  } catch {
    return [];
  }
}

async function markIntentsConsumed(ids, cycleId) {
  if (!ids.length) return;
  try {
    await db.query(
      `UPDATE pending_intents
       SET consumed_at = NOW(), cycle_id = $1
       WHERE id = ANY($2)`,
      [cycleId, ids]
    );
  } catch (err) {
    console.error('[index] Failed to mark intents consumed:', err.message);
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────

async function runCycle() {
  console.log(`\n[${new Date().toISOString()}] ── NEURALIS agent rebalance cycle ──`);

  try {
    const { strategies, currentAllocations } = await collect(provider);

    if (!strategies.length) {
      console.log('[cycle] No strategies found — skipping');
      return;
    }

    const scored = score(strategies);

    // Fetch any pending user intents
    const intentRows    = await fetchPendingIntents();
    const intentTexts   = intentRows.map((r) => r.intent_text);
    const intentIds     = intentRows.map((r) => r.id);
    if (intentTexts.length) {
      console.log(`[cycle] ${intentTexts.length} pending user intent(s) found`);
    }

    const recommendation = await recommend(scored, intentTexts);
    await execute(recommendation, currentAllocations, provider, db);

    // Mark intents consumed — get the latest rebalance_history id
    if (intentIds.length) {
      const { rows } = await db.query(
        `SELECT id FROM rebalance_history ORDER BY executed_at DESC LIMIT 1`
      );
      const cycleId = rows[0]?.id ?? null;
      await markIntentsConsumed(intentIds, cycleId);
      console.log(`[cycle] ${intentIds.length} intent(s) marked consumed`);
    }

  } catch (err) {
    console.error('[cycle] ERROR:', err.message ?? err);
  }

  console.log(`[${new Date().toISOString()}] ── Cycle complete ──`);
}

// ── Start ─────────────────────────────────────────────────────────────────────

console.log(`[startup] Agent starting — cron: every ${INTERVAL_MINUTES} min`);

runCycle();
cron.schedule(CRON_EXPRESSION, runCycle);

process.on('SIGTERM', async () => {
  console.log('[shutdown] SIGTERM received — closing DB pool');
  await db.end();
  process.exit(0);
});
