'use strict';

const { ethers } = require('ethers');
const moveClient = require('./move_client');

const KEEPER_EXECUTOR_ABI = [
  'function execute(address[] calldata strategies, uint256[] calldata newBps, bytes calldata signature) external',
  'function nonce() external view returns (uint256)',
  'function nextMessageHash(address[] calldata strategies, uint256[] calldata newBps) external view returns (bytes32 messageHash, bytes32 ethSignedHash)',
];

/**
 * Compare proposed allocations to current onchain allocations.
 * Returns the maximum delta in basis points across all strategies.
 */
function maxDelta(newAlloc, currentAlloc) {
  const allAddresses = new Set([
    ...Object.keys(newAlloc),
    ...Object.keys(currentAlloc),
  ]);
  let max = 0;
  for (const addr of allAddresses) {
    const delta = Math.abs((newAlloc[addr] ?? 0) - (currentAlloc[addr] ?? 0));
    if (delta > max) max = delta;
  }
  return max;
}

/**
 * BCS-encode a rebalance payload for the ProgrammableIntents module.
 * Layout: [strategy_count u8] [addr0 32 bytes] [bps0 u64 LE] ... repeated
 */
function encodeRebalanceParams(strategies, newBps) {
  const { bcs } = require('@initia/initia.js');
  const parts = [new Uint8Array([strategies.length])];
  for (let i = 0; i < strategies.length; i++) {
    parts.push(bcs.address().serialize(strategies[i]).toBytes());
    parts.push(bcs.u64().serialize(BigInt(newBps[i])).toBytes());
  }
  const total = parts.reduce((s, p) => s + p.length, 0);
  const buf   = new Uint8Array(total);
  let offset  = 0;
  for (const p of parts) { buf.set(p, offset); offset += p.length; }
  return buf;
}

/**
 * Execute (or skip) the rebalance recommended by Claude.
 * After a successful EVM rebalance:
 *   1. Submits a ProgrammableIntent (REBALANCE_VAULT) to the MoveVM.
 *   2. Marks the intent EXECUTED.
 *   3. Mints / levels up a LaborBadge for the keeper address.
 *   4. Records everything in PostgreSQL.
 */
async function execute(recommendation, currentAllocations, provider, db) {
  const { allocations: newAlloc, explanation } = recommendation;
  const threshold = Number(process.env.MIN_REBALANCE_THRESHOLD_BPS ?? 50);

  const delta = maxDelta(newAlloc, currentAllocations);
  console.log(`[executor] Max delta: ${delta} bps (threshold: ${threshold} bps)`);

  const prevAllocJson = JSON.stringify(currentAllocations);
  const newAllocJson  = JSON.stringify(newAlloc);

  // ── Skip if delta is below threshold ─────────────────────────────────────
  if (delta < threshold) {
    console.log('[executor] Delta below threshold — skipping rebalance');
    await db.query(
      `INSERT INTO rebalance_history (prev_alloc, new_alloc, explanation, triggered)
       VALUES ($1, $2, $3, $4)`,
      [prevAllocJson, newAllocJson, explanation, false],
    );
    return;
  }

  // ── Build strategy / bps arrays ───────────────────────────────────────────
  const entries    = Object.entries(newAlloc);
  const strategies = entries.map(([addr]) => addr);
  const newBps     = entries.map(([, bps]) => bps);

  // ── Sign and submit EVM rebalance ─────────────────────────────────────────
  const signer       = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY, provider);
  const executor     = new ethers.Contract(process.env.KEEPER_EXECUTOR_ADDRESS, KEEPER_EXECUTOR_ABI, signer);
  const currentNonce = await executor.nonce();

  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address[]', 'uint256[]', 'uint256', 'uint256'],
      [strategies, newBps, (await provider.getNetwork()).chainId, currentNonce],
    ),
  );
  const signature = await signer.signMessage(ethers.getBytes(messageHash));

  console.log('[executor] Submitting EVM rebalance tx…');
  const tx      = await executor.execute(strategies, newBps, signature);
  console.log(`[executor] EVM TX submitted: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`[executor] EVM TX confirmed in block ${receipt.blockNumber}`);

  // ── MoveVM: submit ProgrammableIntent ─────────────────────────────────────
  let intentId = -1;
  const moveEnabled = !!(
    process.env.MOVE_REST_URL &&
    process.env.MOVE_CHAIN_ID &&
    process.env.MOVE_MODULE_ADDRESS &&
    process.env.KEEPER_MNEMONIC
  );

  if (moveEnabled) {
    try {
      const params          = encodeRebalanceParams(strategies, newBps);
      const deadlineSeconds = Math.floor(Date.now() / 1000) + 300; // 5 min window
      const ownerAddress    = process.env.KEEPER_INITIA_ADDRESS ?? signer.address;

      const { txHash: intentTx, intentId: id } = await moveClient.submitIntent({
        ownerInitiaAddress: ownerAddress,
        actionType        : moveClient.ACTION_REBALANCE_VAULT,
        params,
        deadlineSeconds,
        description       : explanation,
      });
      intentId = id;
      console.log(`[executor] ProgrammableIntent submitted — id=${intentId} tx=${intentTx}`);

      // Mark executed immediately since EVM tx already confirmed
      await moveClient.markIntentExecuted(intentId);
      console.log(`[executor] ProgrammableIntent ${intentId} marked EXECUTED`);

      // ── MoveVM: mint / level-up LaborBadge ─────────────────────────────────
      await _handleLaborBadge(ownerAddress, db);

      // ── MoveVM: grant Arena credits (10 per triggered rebalance) ───────────
      try {
        await moveClient.grantArenaCredits(
          ownerAddress,
          10,
          `Rebalance cycle — delta ${delta} bps`
        );
        console.log('[executor] Arena credits granted');
      } catch (credErr) {
        console.error('[executor] Arena credit grant failed (non-fatal):', credErr.message);
      }

    } catch (moveErr) {
      // MoveVM errors must NOT block the EVM rebalance record
      console.error('[executor] MoveVM error (non-fatal):', moveErr.message ?? moveErr);
      if (intentId >= 0) {
        try {
          await moveClient.markIntentFailed(intentId, moveErr.message ?? 'unknown');
        } catch (_) { /* best-effort */ }
      }
    }
  } else {
    console.log('[executor] MoveVM env vars not set — skipping LaborBadge / ProgrammableIntents');
  }

  // ── Persist to PostgreSQL ─────────────────────────────────────────────────
  await db.query(
    `INSERT INTO rebalance_history (tx_hash, prev_alloc, new_alloc, explanation, triggered, intent_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tx.hash, prevAllocJson, newAllocJson, explanation, true, intentId >= 0 ? intentId : null],
  );

  console.log('[executor] Rebalance recorded in DB');
}

// ── Internal: badge logic ─────────────────────────────────────────────────────

/**
 * Mint the YIELD_HARVESTER badge on first rebalance, then level up on milestones.
 * Milestone thresholds: 10 → REBALANCE_MASTER, 100 → PROTOCOL_VETERAN.
 */
async function _handleLaborBadge(ownerAddress, db) {
  // Count total triggered rebalances for this keeper
  const { rows } = await db.query(
    `SELECT COUNT(*) AS cnt FROM rebalance_history WHERE triggered = true`
  );
  const totalTriggered = Number(rows[0]?.cnt ?? 0) + 1; // +1 for current cycle

  const hasBadge0 = await moveClient.hasBadge(ownerAddress, moveClient.BADGE_YIELD_HARVESTER);

  if (!hasBadge0) {
    // First ever rebalance — mint YIELD_HARVESTER
    await moveClient.mintLaborBadge(
      ownerAddress,
      moveClient.BADGE_YIELD_HARVESTER,
      `NEURALIS Yield Harvester — first rebalance at cycle ${totalTriggered}`
    );
    console.log('[executor] LaborBadge YIELD_HARVESTER minted');
  } else {
    // Level up YIELD_HARVESTER every 10 rebalances
    if (totalTriggered % 10 === 0) {
      await moveClient.levelUpLaborBadge(ownerAddress, moveClient.BADGE_YIELD_HARVESTER);
      console.log(`[executor] LaborBadge YIELD_HARVESTER leveled up at cycle ${totalTriggered}`);
    }
  }

  // Mint REBALANCE_MASTER at 10 triggered rebalances
  if (totalTriggered === 10) {
    const hasBadge1 = await moveClient.hasBadge(ownerAddress, moveClient.BADGE_REBALANCE_MASTER);
    if (!hasBadge1) {
      await moveClient.mintLaborBadge(
        ownerAddress,
        moveClient.BADGE_REBALANCE_MASTER,
        `NEURALIS Rebalance Master — 10 successful rebalances`
      );
      console.log('[executor] LaborBadge REBALANCE_MASTER minted');
    }
  }

  // Mint PROTOCOL_VETERAN at 100 triggered rebalances
  if (totalTriggered === 100) {
    const hasBadge3 = await moveClient.hasBadge(ownerAddress, moveClient.BADGE_PROTOCOL_VETERAN);
    if (!hasBadge3) {
      await moveClient.mintLaborBadge(
        ownerAddress,
        moveClient.BADGE_PROTOCOL_VETERAN,
        `NEURALIS Protocol Veteran — 100 successful rebalances`
      );
      console.log('[executor] LaborBadge PROTOCOL_VETERAN minted');
    }
  }
}

module.exports = { execute };
