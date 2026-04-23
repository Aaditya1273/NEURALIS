'use strict';

/**
 * move_client.js (Perfect Sync Edition)
 * ──────────────
 * Advanced wrapper for Initia L1 Hub. 
 * Automatically handles Bech32/Hex conversion to prevent 404 errors.
 */

const {
  RESTClient,
  MnemonicKey,
  Wallet,
  MsgExecute,
  bcs,
} = require('@initia/initia.js');

const BADGE_YIELD_HARVESTER  = 0;
const BADGE_REBALANCE_MASTER = 1;
const BADGE_ARENA_CHAMPION   = 2;
const BADGE_PROTOCOL_VETERAN = 3;

const ACTION_REBALANCE_VAULT  = 0;
const ACTION_HARVEST_YIELD    = 1;
const ACTION_BRIDGE_LIQUIDITY = 2;
const ACTION_ARENA_ENTER      = 3;

const STATUS_PENDING  = 0;
const STATUS_EXECUTED = 1;
const STATUS_FAILED   = 2;
const STATUS_EXPIRED  = 3;

// The definitive HEX address of your modules
const MODULE_HEX = '0xE3659695DCBAAE0CAEAC70B0F9C36DAEC936CB8B';

function buildMoveClient() {
  const restUrl       = process.env.MOVE_REST_URL;
  const chainId       = process.env.MOVE_CHAIN_ID;
  const bech32Address = process.env.MOVE_MODULE_ADDRESS;
  const mnemonic      = process.env.KEEPER_MNEMONIC;

  if (!restUrl || !chainId || !bech32Address || !mnemonic) {
    throw new Error('Missing MoveVM configuration in .env');
  }

  const client = new RESTClient(restUrl, { chainId });
  const key    = new MnemonicKey({ mnemonic });
  const wallet = new Wallet(client, key);

  return { client, wallet, bech32Address, hexAddress: MODULE_HEX, chainId };
}

// ── LaborBadge ────────────────────────────────────────────────────────────────

async function mintLaborBadge(recipientInitiaAddress, badgeType, metadata) {
  const { client, wallet, hexAddress } = buildMoveClient();
  const msg = new MsgExecute(
    wallet.key.accAddress,
    hexAddress,
    'labor_badge',
    'mint_badge',
    [],
    [
      bcs.address().serialize(recipientInitiaAddress).toBase64(),
      bcs.u8().serialize(badgeType).toBase64(),
      bcs.string().serialize(metadata).toBase64(),
    ]
  );
  const tx = await wallet.createAndSignTx({ msgs: [msg] });
  const result = await client.tx.broadcast(tx);
  return result.txhash;
}

async function updateBadgeStats(ownerInitiaAddress, badgeType, yieldBps, riskScore) {
  const { client, wallet, hexAddress } = buildMoveClient();
  const msg = new MsgExecute(
    wallet.key.accAddress,
    hexAddress,
    'labor_badge',
    'update_stats',
    [],
    [
      bcs.address().serialize(ownerInitiaAddress).toBase64(),
      bcs.u8().serialize(badgeType).toBase64(),
      bcs.u64().serialize(BigInt(yieldBps)).toBase64(),
      bcs.u64().serialize(BigInt(riskScore)).toBase64(),
    ]
  );
  const tx = await wallet.createAndSignTx({ msgs: [msg] });
  const result = await client.tx.broadcast(tx);
  return result.txhash;
}

async function hasBadge(ownerInitiaAddress, badgeType) {
  const { client, bech32Address } = buildMoveClient();
  try {
    const res = await client.move.viewFunction(
      bech32Address,
      'labor_badge',
      'has_badge',
      [],
      [
        bcs.address().serialize(bech32Address).toBase64(),
        bcs.address().serialize(ownerInitiaAddress).toBase64(),
        bcs.u8().serialize(badgeType).toBase64(),
      ]
    );
    return res.data === 'true';
  } catch (e) { return false; }
}

// ── ProgrammableIntents ────────────────────────────────────────────────────────

async function submitIntent(ownerInitiaAddress, actionType, params, deadline, nonce, signature, description) {
  const { client, wallet, hexAddress } = buildMoveClient();
  const msg = new MsgExecute(
    wallet.key.accAddress,
    hexAddress,
    'programmable_intents',
    'submit_intent',
    [],
    [
      bcs.address().serialize(ownerInitiaAddress).toBase64(),
      bcs.u8().serialize(actionType).toBase64(),
      bcs.vector(bcs.u8()).serialize(params).toBase64(),
      bcs.u64().serialize(BigInt(deadline)).toBase64(),
      bcs.u64().serialize(BigInt(nonce)).toBase64(),
      bcs.vector(bcs.u8()).serialize(signature).toBase64(),
      bcs.string().serialize(description).toBase64(),
    ]
  );
  const tx = await wallet.createAndSignTx({ msgs: [msg] });
  const result = await client.tx.broadcast(tx);
  return result.txhash;
}

async function markIntentExecuted(intentId) {
  const { client, wallet, hexAddress } = buildMoveClient();
  const msg = new MsgExecute(
    wallet.key.accAddress,
    hexAddress,
    'programmable_intents',
    'mark_executed',
    [],
    [bcs.u64().serialize(BigInt(intentId)).toBase64()]
  );
  const tx = await wallet.createAndSignTx({ msgs: [msg] });
  const result = await client.tx.broadcast(tx);
  return result.txhash;
}

// ── AgentArena ───────────────────────────────────────────────────────────────

async function grantArenaCredits(recipientInitiaAddress, amount, reason) {
  const { client, wallet, hexAddress } = buildMoveClient();
  const msg = new MsgExecute(
    wallet.key.accAddress,
    hexAddress,
    'agent_arena',
    'grant_credits',
    [],
    [
      bcs.address().serialize(recipientInitiaAddress).toBase64(),
      bcs.u64().serialize(BigInt(amount)).toBase64(),
      bcs.string().serialize(reason).toBase64(),
    ]
  );
  const tx = await wallet.createAndSignTx({ msgs: [msg] });
  const result = await client.tx.broadcast(tx);
  return result.txhash;
}

module.exports = {
  mintLaborBadge,
  updateBadgeStats,
  hasBadge,
  submitIntent,
  markIntentExecuted,
  grantArenaCredits,
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
