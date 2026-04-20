'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInterwovenKit } from '@initia/interwovenkit-react';
import Link from 'next/link';

const MODULE_ADDR  = process.env.NEXT_PUBLIC_MOVE_MODULE_ADDRESS ?? '';
const CHAIN_ID     = process.env.NEXT_PUBLIC_INTERWOVEN_CHAIN_ID ?? 'neuralis-1';
const REST_URL     = process.env.NEXT_PUBLIC_INTERWOVEN_REST_URL ?? 'http://localhost:1317';

// ── Move view helper ──────────────────────────────────────────────────────────

async function moveView(moduleName: string, fnName: string, args: string[]): Promise<unknown> {
  const res = await fetch(
    `${REST_URL}/initia/move/v1/accounts/${MODULE_ADDR}/modules/${moduleName}/view_functions/${fnName}`,
    {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ type_args: [], args }),
    }
  );
  if (!res.ok) throw new Error(`Move view failed: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type BattleState = 'WAITING' | 'ACTIVE' | 'FINISHED' | 'UNKNOWN';
const STATE_MAP: Record<number, BattleState> = { 0: 'WAITING', 1: 'ACTIVE', 2: 'FINISHED' };

interface BattleInfo {
  id       : number;
  state    : BattleState;
  hp1      : number;
  hp2      : number;
  winner   : string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ArenaPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { address, openConnect, requestTxSync } = useInterwovenKit();

  const [credits, setCredits]         = useState<number | null>(null);
  const [battleId, setBattleId]       = useState('');
  const [stake, setStake]             = useState('10');
  const [battle, setBattle]           = useState<BattleInfo | null>(null);
  const [status, setStatus]           = useState('');
  const [loading, setLoading]         = useState(false);

  // ── Fetch credits ───────────────────────────────────────────────────────────

  const fetchCredits = useCallback(async () => {
    if (!address || !MODULE_ADDR) return;
    try {
      const data = await moveView('agent_arena', 'get_credits', [
        `"${MODULE_ADDR}"`,
        `"${address}"`,
      ]);
      setCredits(Number(data));
    } catch { setCredits(0); }
  }, [address]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  // ── Fetch battle ────────────────────────────────────────────────────────────

  async function fetchBattle(id: number) {
    try {
      const [stateRaw, hpRaw, winnerRaw] = await Promise.all([
        moveView('agent_arena', 'get_battle_state',  [`"${MODULE_ADDR}"`, String(id)]),
        moveView('agent_arena', 'get_battle_hp',     [`"${MODULE_ADDR}"`, String(id)]),
        moveView('agent_arena', 'get_battle_winner', [`"${MODULE_ADDR}"`, String(id)]),
      ]);
      const [hp1, hp2] = hpRaw as [number, number];
      setBattle({
        id,
        state : STATE_MAP[Number(stateRaw)] ?? 'UNKNOWN',
        hp1   : Number(hp1),
        hp2   : Number(hp2),
        winner: String(winnerRaw),
      });
    } catch (e) {
      setStatus('Battle not found.');
    }
  }

  // ── Create battle ───────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!address || !MODULE_ADDR) { setStatus('Connect wallet first.'); return; }
    setLoading(true); setStatus('');
    try {
      const txHash = await requestTxSync({
        chainId : CHAIN_ID,
        messages: [{
          typeUrl: '/initia.move.v1.MsgExecute',
          value  : {
            sender      : address,
            moduleAddress: MODULE_ADDR,
            moduleName  : 'agent_arena',
            functionName: 'create_battle',
            typeArgs    : [],
            args        : [encodeU64(Number(stake))],
          },
        }],
      });
      setStatus(`Battle created! TX: ${txHash}`);
      await fetchCredits();
    } catch (e: unknown) {
      setStatus('Error: ' + (e instanceof Error ? e.message.slice(0, 80) : String(e)));
    } finally { setLoading(false); }
  }

  // ── Join battle ─────────────────────────────────────────────────────────────

  async function handleJoin() {
    if (!address || !MODULE_ADDR || !battleId) return;
    setLoading(true); setStatus('');
    try {
      const txHash = await requestTxSync({
        chainId : CHAIN_ID,
        messages: [{
          typeUrl: '/initia.move.v1.MsgExecute',
          value  : {
            sender      : address,
            moduleAddress: MODULE_ADDR,
            moduleName  : 'agent_arena',
            functionName: 'join_battle',
            typeArgs    : [],
            args        : [encodeU64(Number(battleId))],
          },
        }],
      });
      setStatus(`Joined battle ${battleId}! TX: ${txHash}`);
      await fetchBattle(Number(battleId));
      await fetchCredits();
    } catch (e: unknown) {
      setStatus('Error: ' + (e instanceof Error ? e.message.slice(0, 80) : String(e)));
    } finally { setLoading(false); }
  }

  // ── Play turn ───────────────────────────────────────────────────────────────

  async function handlePlayTurn(moveType: number) {
    if (!address || !MODULE_ADDR || !battle) return;
    setLoading(true); setStatus('');
    try {
      const txHash = await requestTxSync({
        chainId : CHAIN_ID,
        messages: [{
          typeUrl: '/initia.move.v1.MsgExecute',
          value  : {
            sender      : address,
            moduleAddress: MODULE_ADDR,
            moduleName  : 'agent_arena',
            functionName: 'play_turn',
            typeArgs    : [],
            args        : [encodeU64(battle.id), encodeU8(moveType)],
          },
        }],
      });
      setStatus(`Move submitted! TX: ${txHash}`);
      await fetchBattle(battle.id);
      await fetchCredits();
    } catch (e: unknown) {
      setStatus('Error: ' + (e instanceof Error ? e.message.slice(0, 80) : String(e)));
    } finally { setLoading(false); }
  }

  if (!mounted) return null;

  if (!address) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass" style={{ padding: '40px 48px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚔️</div>
          <h2 style={{ fontSize: 22, fontWeight: 300, color: 'var(--text)', marginBottom: 10 }}>Agent Arena</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
            Connect your wallet to enter 1v1 battles with Neural Credits earned from yield harvesting.
          </p>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={openConnect}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

      {/* Left: credits + create/join */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Credits */}
        <div className="glass" style={{ padding: 20 }}>
          <p className="panel-title">Neural Credits</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 100, letterSpacing: '-0.03em', color: 'var(--text)' }}>
              {credits ?? '—'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>$NEURAL</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Earned from vault rebalance cycles. Stake to battle.
          </p>
          {credits === 0 && (
            <Link href="/vault" style={{ display: 'inline-block', marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline' }}>
              Deposit to earn credits →
            </Link>
          )}
        </div>

        {/* Create battle */}
        <div className="glass" style={{ padding: 20 }}>
          <p className="panel-title">Create Battle</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="label">Stake (credits)</span>
          </div>
          <input
            className="field-input"
            type="number" min="1" value={stake}
            onChange={(e) => setStake(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleCreate} disabled={loading || !stake || (credits ?? 0) < Number(stake)}>
            {loading ? 'Submitting…' : 'Create Battle →'}
          </button>
        </div>

        {/* Join battle */}
        <div className="glass" style={{ padding: 20 }}>
          <p className="panel-title">Join Battle</p>
          <input
            className="field-input"
            type="number" min="0" placeholder="Battle ID"
            value={battleId}
            onChange={(e) => setBattleId(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => battleId && fetchBattle(Number(battleId))} disabled={!battleId}>
              View
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleJoin} disabled={loading || !battleId}>
              Join →
            </button>
          </div>
        </div>
      </div>

      {/* Right: active battle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {battle ? (
          <div className="glass" style={{ padding: 20 }}>
            <p className="panel-title">Battle #{battle.id}</p>

            {/* HP bars */}
            <div style={{ marginBottom: 20 }}>
              <HPBar label="Player 1" hp={battle.hp1} />
              <div style={{ textAlign: 'center', fontSize: 18, color: 'var(--text-dim)', margin: '8px 0' }}>VS</div>
              <HPBar label="Player 2" hp={battle.hp2} />
            </div>

            {/* State badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '4px 12px', borderRadius: 100,
                background: battle.state === 'ACTIVE' ? 'rgba(50,215,75,0.1)' : battle.state === 'FINISHED' ? 'rgba(255,255,255,0.06)' : 'rgba(255,165,0,0.1)',
                color: battle.state === 'ACTIVE' ? 'var(--green)' : battle.state === 'FINISHED' ? 'var(--text-muted)' : '#FFA500',
                border: `1px solid ${battle.state === 'ACTIVE' ? 'rgba(50,215,75,0.2)' : 'var(--border)'}`,
              }}>
                {battle.state}
              </span>
            </div>

            {battle.state === 'FINISHED' && battle.winner !== '0x0000000000000000000000000000000000000000' && (
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(50,215,75,0.05)', border: '1px solid rgba(50,215,75,0.15)', borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Winner</p>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                  {battle.winner.slice(0, 8)}…{battle.winner.slice(-4)}
                </p>
              </div>
            )}

            {battle.state === 'ACTIVE' && (
              <div>
                <p className="label" style={{ marginBottom: 12, textAlign: 'center' }}>Your Move</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { type: 0, label: '⚔️ Attack',  desc: '15-24 dmg' },
                    { type: 1, label: '🛡 Defend',  desc: '3-6 dmg' },
                    { type: 2, label: '✨ Special', desc: '25-34 dmg' },
                  ].map((m) => (
                    <button key={m.type}
                      onClick={() => handlePlayTurn(m.type)}
                      disabled={loading}
                      style={{
                        padding: '12px 8px', borderRadius: 10, border: '1px solid var(--border)',
                        background: 'var(--bg-input)', cursor: 'pointer', textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{m.label.split(' ')[0]}</div>
                      <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{m.label.split(' ')[1]}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚔️</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Create a battle or enter a Battle ID to view an active match.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="glass" style={{ padding: 20 }}>
          <p className="panel-title">Rules</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Format', '1v1 Turn-based'],
              ['Starting HP', '100 each'],
              ['Win condition', 'Reduce opponent to 0 HP'],
              ['Prize', 'Stake × 2 − 5% fee'],
              ['Result', 'On-chain (MoveVM)'],
            ].map(([k, v]) => (
              <div key={k} className="data-pill">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                <span className="metric">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      {status && (
        <div style={{
          gridColumn: '1 / -1', padding: '12px 16px',
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
        }}>
          {status}
        </div>
      )}
    </div>
  );
}

// ── HP Bar ────────────────────────────────────────────────────────────────────

function HPBar({ label, hp }: { label: string; hp: number }) {
  const pct = Math.max(0, Math.min(100, hp));
  const color = pct > 50 ? 'var(--green)' : pct > 25 ? '#FFA500' : 'var(--red)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color }}>{hp} HP</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ── BCS helpers ───────────────────────────────────────────────────────────────

function encodeU64(n: number): Uint8Array {
  const buf = new Uint8Array(8);
  let v = BigInt(n);
  for (let i = 0; i < 8; i++) { buf[i] = Number(v & 0xffn); v >>= 8n; }
  return buf;
}

function encodeU8(n: number): Uint8Array {
  return new Uint8Array([n]);
}
