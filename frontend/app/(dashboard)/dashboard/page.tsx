'use client';

import { useEffect, useState } from 'react';
import { useInterwovenKit } from '@initia/interwovenkit-react';
import { useVault } from '@/hooks/useVault';
import { useRebalanceHistory } from '@/hooks/useRebalanceHistory';
import { AllocationChart } from '@/components/AllocationChart';
import { RebalanceHistory } from '@/components/RebalanceHistory';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { totalAssetsFormatted }  = useVault();
  const { data: history }         = useRebalanceHistory(1);
  const { address, username }     = useInterwovenKit();

  const [vaultStats, setVaultStats] = useState<{
    total_rebalances: string;
    triggered_count : string;
    last_rebalance_at: string | null;
  } | null>(null);

  const [autoSignExpiry, setAutoSignExpiry] = useState<number | null>(null);

  const [feeStats, setFeeStats] = useState<{
    totalFeesCollected: string;
    pendingFees: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/vault-stats')
      .then((r) => r.json())
      .then((j) => setVaultStats(j.data))
      .catch(console.error);

    fetch('/api/sequencer-fees')
      .then((r) => r.json())
      .then((j) => setFeeStats(j.data))
      .catch(console.error);

    const stored = localStorage.getItem('neuralis_autosign_expiry');
    if (stored) setAutoSignExpiry(Number(stored));
  }, []);

  const DEMO_ALLOC = [
    { name: 'DEX LP A (0x1111…)', value: 3500 },
    { name: 'DEX LP B (0x2222…)', value: 3000 },
    { name: 'DEX LP C (0x3333…)', value: 3500 },
  ];

  const latestAlloc    = history.find((e) => e.triggered)?.new_alloc ?? {};
  const allocationData = Object.keys(latestAlloc).length
    ? Object.entries(latestAlloc).map(([addr, bps], i) => ({
        name : `Strategy ${i + 1} (${addr.slice(0, 6)}…)`,
        value: bps as number,
      }))
    : DEMO_ALLOC;

  const lastRebalanceAt = vaultStats?.last_rebalance_at
    ? new Date(vaultStats.last_rebalance_at).toLocaleString()
    : '—';

  // Auto-sign session remaining time
  const autoSignActive    = autoSignExpiry !== null && autoSignExpiry > Date.now();
  const autoSignRemaining = autoSignActive
    ? Math.ceil((autoSignExpiry! - Date.now()) / 1000 / 3600)
    : 0;

  if (!mounted) {
    return (
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px' }}>
        <p className="panel-title" style={{ marginBottom: 28 }}>NEURALIS Dashboard</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass" style={{ height: 84, opacity: 0.25 }} />
          ))}
        </div>
        <div className="glass" style={{ height: 280, opacity: 0.25 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header row: title + identity */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <p className="panel-title" style={{ marginBottom: 0 }}>NEURALIS Dashboard</p>

        {address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* .init username badge */}
            {username && (
              <div style={{
                fontSize: 12, fontWeight: 500, color: 'var(--text)',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                borderRadius: 100, padding: '4px 12px',
              }}>
                {username}
              </div>
            )}

            {/* Auto-sign session badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: autoSignActive ? 'var(--green)' : 'var(--text-dim)',
              background: autoSignActive ? 'rgba(50,215,75,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${autoSignActive ? 'rgba(50,215,75,0.2)' : 'var(--border)'}`,
              borderRadius: 100, padding: '4px 10px',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: autoSignActive ? 'var(--green)' : 'var(--text-dim)',
                boxShadow: autoSignActive ? '0 0 4px var(--green)' : 'none',
              }} />
              {autoSignActive
                ? `Auto-sign · ${autoSignRemaining}h left`
                : 'Auto-sign inactive'}
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total TVL"        value={totalAssetsFormatted ? `${Number(totalAssetsFormatted).toFixed(2)} USDC` : '—'} />
        <StatCard label="Agent Cycles"     value={vaultStats?.total_rebalances ?? '—'} mono />
        <StatCard label="Rebalances"       value={vaultStats?.triggered_count  ?? '—'} mono />
        <StatCard label="Last Rebalance"   value={lastRebalanceAt} small />
        <StatCard label="Seq. Fees Total"  value={feeStats ? `${feeStats.totalFeesCollected} USDC` : '—'} mono />
        <StatCard label="Seq. Fees Pending" value={feeStats ? `${feeStats.pendingFees} USDC` : '—'} mono />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="Allocation">
          <AllocationChart data={allocationData} />
        </Panel>
        <Panel title="Rebalance History">
          <RebalanceHistory />
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ label, value, small, mono }: { label: string; value: string; small?: boolean; mono?: boolean }) {
  return (
    <div className="glass" style={{ padding: '16px 20px' }}>
      <p className="label" style={{ marginBottom: 8 }}>{label}</p>
      <p style={{
        fontSize: small ? 13 : 24,
        fontWeight: small ? 400 : 100,
        fontFamily: mono || small ? 'var(--font-mono)' : 'var(--font-sans)',
        color: 'var(--text)',
        letterSpacing: small ? '0.01em' : '-0.02em',
        lineHeight: 1.1,
      }}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: '20px 20px' }}>
      <p className="panel-title">{title}</p>
      {children}
    </div>
  );
}
