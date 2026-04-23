'use strict';

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
 * Ask Groq to recommend an optimal allocation.
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  console.log('[recommender] Asking Groq for optimal allocations...');
  
  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(payload, null, 2) },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });
  } catch (err) {
    throw new Error(`Groq network error: ${err.message}. Check your internet connection.`);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices[0]?.message?.content ?? '';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Groq returned non-JSON response:\n${rawText}`);
  }

  // ─── Normalization Logic ──────────────────────────────────────────────────
  // AI models sometimes make rounding errors. We must ensure the sum is exactly 10000.
  const allocs = parsed.allocations;
  const keys   = Object.keys(allocs);
  let currentSum = 0;
  keys.forEach(k => currentSum += allocs[k]);

  if (currentSum !== 10000 && currentSum > 0) {
    console.log(`[recommender] Normalizing sum from ${currentSum} to 10000...`);
    const factor = 10000 / currentSum;
    let newSum = 0;
    
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        // Last one takes the remainder to ensure exact 10000
        allocs[k] = 10000 - newSum;
      } else {
        allocs[k] = Math.floor(allocs[k] * factor);
        newSum += allocs[k];
      }
    });
  }

  if (!parsed.allocations || typeof parsed.allocations !== 'object') {
    throw new Error('Missing or invalid "allocations" field in Groq response');
  }
  if (typeof parsed.explanation !== 'string') {
    throw new Error('Missing "explanation" field in Groq response');
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

  console.log('[recommender] Groq recommendation:', parsed.explanation);
  return parsed;
}

module.exports = { recommend };
