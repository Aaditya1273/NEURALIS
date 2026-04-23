'use strict';

// ── Mock global fetch for Groq API ───────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Helpers ───────────────────────────────────────────────────────────────────

const ADDR_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const ADDR_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function makeStrategies(allocations = { [ADDR_A]: 5000, [ADDR_B]: 5000 }) {
  return Object.entries(allocations).map(([address, currentBps]) => ({
    address,
    apy:           500,
    tvl:           BigInt(100_000_000),
    riskScore:     20,
    currentBps,
    compositeScore: 0.75,
  }));
}

function mockResponse(allocations, explanation = 'Test explanation') {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ allocations, explanation }) } }],
    }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('recommender', () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.GROQ_API_KEY;
  });

  test('returns parsed allocations and explanation', async () => {
    mockResponse({ [ADDR_A]: 6000, [ADDR_B]: 4000 });
    const { recommend } = require('../recommender');
    const result = await recommend(makeStrategies({ [ADDR_A]: 5000, [ADDR_B]: 5000 }));
    expect(result.allocations[ADDR_A]).toBe(6000);
    expect(result.explanation).toBe('Test explanation');
  });

  test('calls Groq with correct model', async () => {
    mockResponse({ [ADDR_A]: 5000, [ADDR_B]: 5000 });
    const { recommend } = require('../recommender');
    await recommend(makeStrategies());
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('llama-3.3-70b-versatile'),
      })
    );
  });

  test('throws if allocations do not sum to 10000', async () => {
    mockResponse({ [ADDR_A]: 4000, [ADDR_B]: 4000 }); // sum = 8000
    const { recommend } = require('../recommender');
    await expect(recommend(makeStrategies())).rejects.toThrow(/sum to 8000/);
  });

  test('throws if response is not valid JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'not json at all' } }],
      }),
    });
    const { recommend } = require('../recommender');
    await expect(recommend(makeStrategies())).rejects.toThrow(/non-JSON/);
  });

  test('throws if response contains unknown strategy address', async () => {
    mockResponse({ '0xunknown': 5000, [ADDR_B]: 5000 });
    const { recommend } = require('../recommender');
    await expect(recommend(makeStrategies())).rejects.toThrow(/Unknown strategy/);
  });

  test('throws if allocations field is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ explanation: 'no allocations key' }) } }],
      }),
    });
    const { recommend } = require('../recommender');
    await expect(recommend(makeStrategies())).rejects.toThrow(/allocations/);
  });
});
