#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# NEURALIS MoveVM Module Deployment Script
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   chmod +x contracts/move/deploy.sh
#   ./contracts/move/deploy.sh
#
# Required env vars (set in .env or export before running):
#   MODULE_OWNER_KEY   — key name in your minitiad keyring (e.g. "gas-station")
#   L2_CHAIN_ID        — your Minitia chain ID (e.g. "neuralis-1")
#   L2_RPC             — Minitia RPC endpoint (e.g. "http://localhost:26657")
#   L2_REST            — Minitia REST endpoint (e.g. "http://localhost:1317")
#   FEE_DENOM          — fee token denom (e.g. "umin" or "uneuralis")
#   KEEPER_ED25519_PUBKEY — hex-encoded Ed25519 public key of the keeper wallet
#                           (derive with: initiad keys show <KEY> --pubkey)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOVE_DIR="$SCRIPT_DIR"

# ── Validate required env vars ────────────────────────────────────────────────
: "${MODULE_OWNER_KEY:?Need MODULE_OWNER_KEY}"
: "${L2_CHAIN_ID:?Need L2_CHAIN_ID}"
: "${L2_RPC:?Need L2_RPC}"
: "${FEE_DENOM:?Need FEE_DENOM}"
: "${KEEPER_ED25519_PUBKEY:?Need KEEPER_ED25519_PUBKEY}"

echo "──────────────────────────────────────────────────────"
echo " NEURALIS MoveVM Deployment"
echo " Chain:  $L2_CHAIN_ID"
echo " RPC:    $L2_RPC"
echo " Owner:  $MODULE_OWNER_KEY"
echo "──────────────────────────────────────────────────────"

# ── Step 1: Get deployer address and convert to hex ───────────────────────────
echo ""
echo "[1/5] Resolving deployer address..."
INIT_ADDR=$(minitiad keys show "$MODULE_OWNER_KEY" --keyring-backend test -a)
echo "      init address : $INIT_ADDR"

HEX_ADDR=$(initiad keys parse "$INIT_ADDR" | grep "bytes:" | awk '{print $2}')
echo "      hex address  : $HEX_ADDR"

# ── Step 2: Patch Move.toml with the real deployer address ───────────────────
echo ""
echo "[2/5] Patching Move.toml with deployer address..."
sed -i "s|<YOUR_HEX_ADDRESS>|$HEX_ADDR|g" "$MOVE_DIR/Move.toml"
echo "      Move.toml updated"

# ── Step 3: Build ─────────────────────────────────────────────────────────────
echo ""
echo "[3/5] Building Move modules..."
initiad move build --path "$MOVE_DIR"
echo "      Build successful"

# ── Step 4: Deploy ────────────────────────────────────────────────────────────
echo ""
echo "[4/5] Deploying to $L2_CHAIN_ID..."
minitiad move deploy \
  --path "$MOVE_DIR" \
  --upgrade-policy COMPATIBLE \
  --from "$MODULE_OWNER_KEY" \
  --keyring-backend test \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices "0.15$FEE_DENOM" \
  --node "$L2_RPC" \
  --chain-id "$L2_CHAIN_ID" \
  --yes
echo "      Deployment tx submitted"

# ── Step 5: Initialize modules ────────────────────────────────────────────────
echo ""
echo "[5/5] Initializing modules..."

# Initialize LaborBadge
echo "      Initializing labor_badge..."
minitiad tx move execute "$HEX_ADDR" labor_badge initialize \
  --args '[]' \
  --from "$MODULE_OWNER_KEY" \
  --keyring-backend test \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices "0.15$FEE_DENOM" \
  --node "$L2_RPC" \
  --chain-id "$L2_CHAIN_ID" \
  --yes
echo "      labor_badge initialized"

# Initialize ProgrammableIntents with the keeper Ed25519 pubkey
echo "      Initializing programmable_intents..."
minitiad tx move execute "$HEX_ADDR" programmable_intents initialize \
  --args "[\"bytes:$KEEPER_ED25519_PUBKEY\"]" \
  --from "$MODULE_OWNER_KEY" \
  --keyring-backend test \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices "0.15$FEE_DENOM" \
  --node "$L2_RPC" \
  --chain-id "$L2_CHAIN_ID" \
  --yes
echo "      programmable_intents initialized"

# Initialize AgentArena
echo "      Initializing agent_arena..."
minitiad tx move execute "$HEX_ADDR" agent_arena initialize \
  --args '[]' \
  --from "$MODULE_OWNER_KEY" \
  --keyring-backend test \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices "0.15$FEE_DENOM" \
  --node "$L2_RPC" \
  --chain-id "$L2_CHAIN_ID" \
  --yes
echo "      agent_arena initialized"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────────────────"
echo " Deployment complete!"
echo ""
echo " Module address (hex): $HEX_ADDR"
echo ""
echo " Add to agent/.env:"
echo "   MOVE_MODULE_ADDRESS=$HEX_ADDR"
echo "   MOVE_CHAIN_ID=$L2_CHAIN_ID"
echo "   MOVE_REST_URL=${L2_REST:-http://localhost:1317}"
echo "──────────────────────────────────────────────────────"

# Verify: query has_badge (should return false for a random address)
echo ""
echo " Verifying labor_badge view function..."
minitiad query move view "$HEX_ADDR" labor_badge has_badge \
  --args "[\"address:$HEX_ADDR\", \"address:$HEX_ADDR\", \"u8:0\"]" \
  --node "$L2_RPC"

echo ""
echo " Verifying programmable_intents view function..."
minitiad query move view "$HEX_ADDR" programmable_intents get_next_intent_id \
  --args "[\"address:$HEX_ADDR\"]" \
  --node "$L2_RPC"

echo ""
echo " All checks passed. NEURALIS MoveVM modules are live."
