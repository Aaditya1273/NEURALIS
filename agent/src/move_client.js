'use strict';

/**
 * move_client.js
 * ──────────────
 * Thin wrapper around the Initia REST API for interacting with the two
 * MoveVM modules: LaborBadge and ProgrammableIntents.
 *
 * Initia REST endpoint for executing a Move entry function:
 *   POST /cosmos/tx/v1beta1/txs
 *   with MsgExecute message type.
 *
 * We use @initia/initia.js (the official JS SDK) which handles BCS encoding,
 * transaction building, signing, and broadcasting.
 *
 * Install:  npm install @initia/initia.js
 */

const {
  RESTClient,
  MnemonicKey,
  Wallet,
  MsgExecute,
  bcs,
} = require('@initia/initia.js');

// ── Badge type constants (must match labor_badge.move) ────────────────────────
const BADGE_YIELD_HARVESTER  = 0;
const BADGE_REBALANCE_MASTER = 1;
const BADGE_ARENA_CHAMPION   = 2;
const BADGE_PROTOCOL_VETERAN = 3;

// ── Action type constants (must match programmable_intents.move) ──────────────
const ACTION_REBALANCE_VAULT  = 0;
const ACTION_HARVEST_YIELD    = 1;
const ACTION_BRIDGE_LIQUIDITY = 2;
const ACTION_ARENA_ENTER      = 3;

// ── Intent status constants ───────────────────────────────────────────────────
const STATUS_PENDING  = 0;
const STATUS_EXECUTED = 1;
const STATUS_FAILED   = 2;
const STATUS_EXPIRED  = 3;

/**
 * Build a MoveClient connected to the NEURALIS Minitia REST endpoint.
 *
 * Required env vars:
 *   MOVE_REST_URL          — e.g. http://localhost:1317
 *   MOVE_CHAIN_ID          — e.g. neuralis-1
 *   MOVE_MODULE_ADDRESS    — hex address of the deployer (= module address)
 *   KEEPER_MNEMONIC        — 24-word mnemonic of the keeper wallet
 *                            (same key whose Ed25519 pubkey is in the Registry)
 */
function buildMoveClient() {
  const restUrl       = process.env.MOVE_REST_URL;
  const chainId       = process.env.MOVE_CHAIN_ID;
  const moduleAddress = process.env.MOVE_MODULE_ADDRESS;
  const mnemonic      = process.env.KEEPER_MNEMONIC;

  if (!restUrl || !chainId || !moduleAddress || !mnemonic) {
    throw new Error(
      'Missing one of: MOVE_REST_URL, MOVE_CHAIN_ID, MOVE_MODULE_ADDRESS, KEEPER_MNEMONIC'
    );
  }

  const client = new RESTClient(restUrl, { chainId });
  const key    = new MnemonicKey({ mnemonic });
  const wallet = new Wallet(client, key);

  return { client, wallet, moduleAddress, chainId };
}

// ── LaborBadge ────────────────────────────────────────────────────────────────

/**
 * Mint a soulbound LaborBadge for `recipientInitiaAddress`.
 *
 * @param {string} recipientInitiaAddress  — init1... bech32 address
 * @param {number} badgeType               — 0-3
 * @param {string} metadata                — human-readable label
 * @returns {Promise<string>}              — tx hash
 */
async function mintLaborBadge(recipientInitiaAddress, badgeType, metadata) {
  const { client, wallet, moduleAddress, chainId } = buildMoveClient();

  const msg = new MsgExecute(
    wallet.key.accAddress,   // sender (keeper)
    moduleAddress,           // module address (= deployer hex)
    'labor_badge',           // module name
    'mint_badge',            // function name
    [],                      // type args
    [
      bcs.address().serialize(recipientInitiaAddress).toBase64(),
      bcs.u8().serialize(badgeType).toBase64(),
      bcs.string().serialize(metadata).toBase64(),
    ]
  );

  const tx = await wallet.createAndSignTx({
    msgs    : [msg],
    chainId,
    gasAdjustment: 1.5,
  });

  const result = await client.tx.broadcast(tx);
  if (result.code !== 0) {
    throw new Error(`mintLaborBadge failed: ${result.raw_log}`);
  }

  console.log(`[move_client] LaborBadge minted — type=${badgeType} recipient=${recipientInitiaAddress} tx=${result.txhash}`);
  return result.txhash;
}

/**
 * Level up an existing LaborBadge.
 *
 * @param {string} ownerInitiaAddress — init1... bech32 address
 * @param {number} badgeType          — 0-3
 * @returns {Promise<string>}         — tx hash
 */
async function levelUpLaborBadge(ownerInitiaAddress, badgeType) {
  const { client, wallet, moduleAddress, chainId } = buildMoveClient();

  const msg = new MsgExecute(
    wallet.key.accAddress,
    moduleAddress,
    'labor_badge',
    'level_up_badge',
    [],
    [
      bcs.address().serialize(ownerInitiaAddress).toBase64(),
      bcs.u8().serialize(badgeType).toBase64(),
    ]
  );

  const tx = await wallet.createAndSignTx({
    msgs    : [msg],
    chainId,
    gasAdjustment: 1.5,
  });

  const result = await client.tx.broadcast(tx);
  if (result.code !== 0) {
    throw new Error(`levelUpLaborBadge failed: ${result.raw_log}`);
  }

  console.log(`[move_client] LaborBadge leveled up — type=${badgeType} owner=${ownerInitiaAddress} tx=${result.txhash}`);
  return result.txhash;
}

/**
 * Query whether an address holds a specific badge type.
 *
 * Uses the Initia REST view function endpoint:
 *   POST /initia/move/v1/accounts/{moduleAddress}/modules/labor_badge/view_functions/has_badge
 *
 * @param {string} ownerInitiaAddress
 * @param {number} badgeType
 * @returns {Promise<boolean>}
 */
async function hasBadge(ownerInitiaAddress, badgeType) {
  const { client, moduleAddress } = buildMoveClient();

  const res = await client.move.viewFunction(
    moduleAddress,
    'labor_badge',
    'has_badge',
    [],
    [
      bcs.address().serialize(moduleAddress).toBase64(),   // module_deployer
      bcs.address().serialize(ownerInitiaAddress).toBase64(),
      bcs.u8().serialize(badgeType).toBase64(),
    ]
  );

  return res.data === 'true' || res.data === true;
}

/**
 * Query the current level of a badge.
 *
 * @param {string} ownerInitiaAddress
 * @param {number} badgeType
 * @returns {Promise<number>}
 */
async function getBadgeLevel(ownerInitiaAddress, badgeType) {
  const { client, moduleAddress } = buildMoveClient();

  const res = await client.move.viewFunction(
    moduleAddress,
    'labor_badge',
    'get_badge_level',
    [],
    [
      bcs.address().serialize(moduleAddress).toBase64(),
      bcs.address().serialize(ownerInitiaAddress).toBase64(),
      bcs.u8().serialize(badgeType).toBase64(),
    ]
  );

  return Number(res.data);
}

// ── ProgrammableIntents ───────────────────────────────────────────────────────

/**
 * Submit a signed intent to the ProgrammableIntents module.
 *
 * The keeper signs the intent off-chain using its Ed25519 key.
 * This function builds the canonical message, signs it, and submits.
 *
 * @param {object} opts
 * @param {string}        opts.ownerInitiaAddress  — intent owner (user)
 * @param {number}        opts.actionType          — 0-3
 * @param {Uint8Array}    opts.params              — BCS-encoded action params
 * @param {number}        opts.deadlineSeconds     — unix timestamp deadline
 * @param {string}        opts.description         — human-readable description
 * @returns {Promise<{txHash: string, intentId: number}>}
 */
async function submitIntent(opts) {
  const {
    ownerInitiaAddress,
    actionType,
    params,
    deadlineSeconds,
    description,
  } = opts;

  const { client, wallet, moduleAddress, chainId } = buildMoveClient();

  // Fetch current nonce for this owner
  const nonceRes = await client.move.viewFunction(
    moduleAddress,
    'programmable_intents',
    'get_owner_nonce',
    [],
    [
      bcs.address().serialize(moduleAddress).toBase64(),
      bcs.address().serialize(ownerInitiaAddress).toBase64(),
    ]
  );
  const nonce = Number(nonceRes.data ?? 0);

  // Build the canonical message (must match build_signed_message in Move)
  const paramsHash = await sha3_256(params);
  const msg        = buildSignedMessage(ownerInitiaAddress, actionType, paramsHash, deadlineSeconds, nonce);
  const msgHash    = await sha3_256(msg);

  // Sign with Ed25519 key derived from the keeper mnemonic
  const signature = await wallet.key.sign(Buffer.from(msgHash));

  const moveMsg = new MsgExecute(
    wallet.key.accAddress,
    moduleAddress,
    'programmable_intents',
    'submit_intent',
    [],
    [
      bcs.address().serialize(ownerInitiaAddress).toBase64(),
      bcs.u8().serialize(actionType).toBase64(),
      bcs.bytes().serialize(params).toBase64(),
      bcs.u64().serialize(BigInt(deadlineSeconds)).toBase64(),
      bcs.u64().serialize(BigInt(nonce)).toBase64(),
      bcs.bytes().serialize(signature).toBase64(),
      bcs.string().serialize(description).toBase64(),
    ]
  );

  const tx = await wallet.createAndSignTx({
    msgs    : [moveMsg],
    chainId,
    gasAdjustment: 1.5,
  });

  const result = await client.tx.broadcast(tx);
  if (result.code !== 0) {
    throw new Error(`submitIntent failed: ${result.raw_log}`);
  }

  // Parse intent_id from the IntentSubmittedEvent in the tx logs
  const intentId = parseIntentIdFromLogs(result.logs ?? []);

  console.log(`[move_client] Intent submitted — id=${intentId} action=${actionType} tx=${result.txhash}`);
  return { txHash: result.txhash, intentId };
}

/**
 * Mark an intent as EXECUTED after the EVM rebalance tx is confirmed.
 *
 * @param {number} intentId
 * @returns {Promise<string>} tx hash
 */
async function markIntentExecuted(intentId) {
  const { client, wallet, moduleAddress, chainId } = buildMoveClient();

  const msg = new MsgExecute(
    wallet.key.accAddress,
    moduleAddress,
    'programmable_intents',
    'mark_executed',
    [],
    [bcs.u64().serialize(BigInt(intentId)).toBase64()]
  );

  const tx = await wallet.createAndSignTx({ msgs: [msg], chainId, gasAdjustment: 1.5 });
  const result = await client.tx.broadcast(tx);
  if (result.code !== 0) throw new Error(`markIntentExecuted failed: ${result.raw_log}`);

  console.log(`[move_client] Intent ${intentId} marked EXECUTED — tx=${result.txhash}`);
  return result.txhash;
}

/**
 * Mark an intent as FAILED.
 *
 * @param {number} intentId
 * @param {string} reason
 * @returns {Promise<string>} tx hash
 */
async function markIntentFailed(intentId, reason) {
  const { client, wallet, moduleAddress, chainId } = buildMoveClient();

  const msg = new MsgExecute(
    wallet.key.accAddress,
    moduleAddress,
    'programmable_intents',
    'mark_failed',
    [],
    [
      bcs.u64().serialize(BigInt(intentId)).toBase64(),
      bcs.string().serialize(reason).toBase64(),
    ]
  );

  const tx = await wallet.createAndSignTx({ msgs: [msg], chainId, gasAdjustment: 1.5 });
  const result = await client.tx.broadcast(tx);
  if (result.code !== 0) throw new Error(`markIntentFailed failed: ${result.raw_log}`);

  console.log(`[move_client] Intent ${intentId} marked FAILED — tx=${result.txhash}`);
  return result.txhash;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Build the canonical signed message — must exactly mirror
 * build_signed_message() in programmable_intents.move.
 *
 * Layout: BCS(owner) ++ u8(action_type) ++ params_hash(32 bytes)
 *         ++ BCS(deadline u64) ++ BCS(nonce u64)
 */
function buildSignedMessage(ownerInitiaAddress, actionType, paramsHash, deadline, nonce) {
  const ownerBytes    = bcs.address().serialize(ownerInitiaAddress).toBytes();
  const actionByte    = new Uint8Array([actionType]);
  const deadlineBytes = bcs.u64().serialize(BigInt(deadline)).toBytes();
  const nonceBytes    = bcs.u64().serialize(BigInt(nonce)).toBytes();

  const total = ownerBytes.length + 1 + paramsHash.length + deadlineBytes.length + nonceBytes.length;
  const msg   = new Uint8Array(total);
  let offset  = 0;

  msg.set(ownerBytes,    offset); offset += ownerBytes.length;
  msg.set(actionByte,    offset); offset += 1;
  msg.set(paramsHash,    offset); offset += paramsHash.length;
  msg.set(deadlineBytes, offset); offset += deadlineBytes.length;
  msg.set(nonceBytes,    offset);

  return msg;
}

/**
 * SHA3-256 using Node.js built-in crypto.
 * Matches std::hash::sha3_256 in Move.
 */
async function sha3_256(data) {
  const { createHash } = require('crypto');
  return createHash('sha3-256').update(data).digest();
}

/**
 * Parse the intent_id from the IntentSubmittedEvent in tx logs.
 * Falls back to -1 if not found (caller should handle).
 */
function parseIntentIdFromLogs(logs) {
  for (const log of logs) {
    for (const event of (log.events ?? [])) {
      if (event.type === 'move' || event.type?.includes('IntentSubmittedEvent')) {
        for (const attr of (event.attributes ?? [])) {
          if (attr.key === 'intent_id') return Number(attr.value);
        }
      }
    }
  }
  return -1;
}

// ── AgentArena ────────────────────────────────────────────────────────────────

/**
 * Grant Neural Credits to a player after a successful rebalance.
 * Amount is proportional to the rebalance delta (more change = more credits).
 *
 * @param {string} recipientInitiaAddress
 * @param {number} amount
 * @param {string} reason
 * @returns {Promise<string>} tx hash
 */
async function grantArenaCredits(recipientInitiaAddress, amount, reason) {
  const { client, wallet, moduleAddress, chainId } = buildMoveClient();

  const msg = new MsgExecute(
    wallet.key.accAddress,
    moduleAddress,
    'agent_arena',
    'grant_credits',
    [],
    [
      bcs.address().serialize(recipientInitiaAddress).toBase64(),
      bcs.u64().serialize(BigInt(amount)).toBase64(),
      bcs.string().serialize(reason).toBase64(),
    ]
  );

  const tx = await wallet.createAndSignTx({ msgs: [msg], chainId, gasAdjustment: 1.5 });
  const result = await client.tx.broadcast(tx);
  if (result.code !== 0) throw new Error(`grantArenaCredits failed: ${result.raw_log}`);

  console.log(`[move_client] Arena credits granted — amount=${amount} recipient=${recipientInitiaAddress} tx=${result.txhash}`);
  return result.txhash;
}

/**
 * Query Neural Credits balance for a player.
 */
async function getArenaCredits(playerInitiaAddress) {
  const { client, moduleAddress } = buildMoveClient();

  const res = await client.move.viewFunction(
    moduleAddress,
    'agent_arena',
    'get_credits',
    [],
    [
      bcs.address().serialize(moduleAddress).toBase64(),
      bcs.address().serialize(playerInitiaAddress).toBase64(),
    ]
  );

  return Number(res.data ?? 0);
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  // LaborBadge
  mintLaborBadge,
  levelUpLaborBadge,
  hasBadge,
  getBadgeLevel,
  // ProgrammableIntents
  submitIntent,
  markIntentExecuted,
  markIntentFailed,
  // AgentArena
  grantArenaCredits,
  getArenaCredits,
  // Constants
  BADGE_YIELD_HARVESTER,
  BADGE_REBALANCE_MASTER,
  BADGE_ARENA_CHAMPION,
  BADGE_PROTOCOL_VETERAN,
  ACTION_REBALANCE_VAULT,
  ACTION_HARVEST_YIELD,
  ACTION_BRIDGE_LIQUIDITY,
  ACTION_ARENA_ENTER,
  STATUS_PENDING,
  STATUS_EXECUTED,
  STATUS_FAILED,
  STATUS_EXPIRED,
};
