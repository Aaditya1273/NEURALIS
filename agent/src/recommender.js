'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic.default();

const SYSTEM_PROMPT = `You are a DeFi yield optimization agent managing a USDC vault on NEURALIS — The Agent Economy Appchain built on Initia EVM.
Given current strategy metrics, vault allocations, and any pending user intents, recommend an optimal rebalance.

Rules you must follow:
- Allocations must sum to exactly 10000 basis points (100%).
- No single strategy may exceed 3500 bps (35%).
- Only increase a strategy's allocation if its compositeScore justifies it.
- Minimize churn: do not recommend changes of less than 50 bps per strategy.
- If user intents are provided, honour them as soft constraints (e.g. "minimize risk" → favour lower riskScore strategies).
- Return ONLY valid JSON — no preamble, no markdown fences, no explanation outside the JSON.

Response format:
{
  "allocations": {
    "0xStrategyAddress": <bps as integer>,
    ...
  },
  "explanation": "<1–3 sentence reasoning visible to users on the NEURALIS dashboard>"
}`;

/**
 * Ask Claude to recommend an optimal allocation.
 *
 * @param {Array<{ address, apy, tvl, riskScore, currentBps, compositeScore }>} scoredStrategies
 * @param {string[]} [pendingIntents]  — user intent strings from pending_intents table
 * @returns {Promise<{ allocations: Record<string, number>, explanation: string }>}
 */
async function recommend(scoredStrategies, pendingIntents = []) {
  const payload = {
    strategies: scoredStrategies.map((s) => ({
      address       : s.address,
      apyBps        : s.apy,
      apyPercent    : (s.apy / 100).toFixed(2) + '%',
      tvlUsdc       : (Number(s.tvl) / 1e6).toFixed(2),
      riskScore     : s.riskScore,
      currentBps    : s.currentBps,
      currentPercent: (s.currentBps / 100).toFixed(2) + '%',
      compositeScore: s.compositeScore,
    })),
  };

  if (pendingIntents.length > 0) {
    payload.userIntents = pendingIntents;
  }

  const response = await client.messages.create({
    model     : 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages  : [{ role: 'user', content: JSON.stringify(payload, null, 2) }],
    system    : SYSTEM_PROMPT,
  });

  const rawText = response.content[0]?.text ?? '';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Claude returned non-JSON response:\n${rawText}`);
  }

  if (!parsed.allocations || typeof parsed.allocations !== 'object') {
    throw new Error('Missing or invalid "allocations" field in Claude response');
  }
  if (typeof parsed.explanation !== 'string') {
    throw new Error('Missing "explanation" field in Claude response');
  }

  const knownAddresses = new Set(scoredStrategies.map((s) => s.address.toLowerCase()));
  let sum = 0;
  for (const [addr, bps] of Object.entries(parsed.allocations)) {
    if (!knownAddresses.has(addr.toLowerCase())) {
      throw new Error(`Unknown strategy address in recommendation: ${addr}`);
    }
    sum += bps;
  }
  if (sum !== 10_000) {
    throw new Error(`Allocations sum to ${sum}, expected 10000`);
  }

  console.log('[recommender] Claude recommendation:', parsed.explanation);
  return parsed;
}

module.exports = { recommend };
