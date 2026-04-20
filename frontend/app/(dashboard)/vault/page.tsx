'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import { useInterwovenKit } from '@initia/interwovenkit-react';
import { useVault } from '@/hooks/useVault';
import { ERC20_ABI, vaultManagerConfig } from '@/lib/contracts';

const bridgeDenom = process.env.NEXT_PUBLIC_INTERWOVEN_BRIDGE_DENOM ?? 'uinit';

export default function VaultPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { address: evmAddress } = useAccount();
  const { address: initiaAddress, openConnect } = useInterwovenKit();

  // Either EVM or Initia wallet connected counts as "connected"
  const isConnected = !!(evmAddress || initiaAddress);

  if (!mounted || !isConnected) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass" style={{ padding: 40, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 20 }}>⬡</div>
          <h2 style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 8, color: 'var(--text)' }}>
            Connect to NEURALIS
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
            Sign in with Google, Email, or any Web3 wallet to access the yield vault.
          </p>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={openConnect}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 980, margin: '0 auto', padding: '32px 24px',
      display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start',
    }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PositionSummary />
        <IntentPanel />
        <BridgePanel />
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <WalletHeader />
        <VaultForm />
      </div>
    </div>
  );
}

// ── Wallet header ─────────────────────────────────────────────────────────────

function WalletHeader() {
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { address: initiaAddress, username, openWallet } = useInterwovenKit();

  const display = username ?? initiaAddress ?? evmAddress;

  return (
    <div className="glass" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {display ? `${display.slice(0, 8)}…${display.slice(-4)}` : '—'}
      </span>
      <button
        onClick={openWallet}
        style={{ fontSize: 11, color: 'var(--text-dim)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}
      >
        Manage
      </button>
    </div>
  );
}

// ── Position summary ──────────────────────────────────────────────────────────

function PositionSummary() {
  const { userAssetsFormatted, userSharesRaw, totalAssetsFormatted, isLoading } = useVault();
  return (
    <div className="glass" style={{ padding: 20 }}>
      <p className="panel-title">Your Position</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StatBox label="Deposited (USDC)"  value={userAssetsFormatted ? Number(userAssetsFormatted).toFixed(2) : '—'} />
        <StatBox label="Vault TVL"         value={totalAssetsFormatted ? Number(totalAssetsFormatted).toFixed(2) : '—'} />
        <StatBox label="Shares (NYV)"      value={userSharesRaw !== undefined ? Number(formatUnits(userSharesRaw, 6)).toFixed(4) : '—'} mono />
        <StatBox label="Status"            value={isLoading ? 'Loading…' : 'Live'} live={!isLoading} />
      </div>
    </div>
  );
}

// ── Natural language intent panel ─────────────────────────────────────────────

function IntentPanel() {
  const [intent, setIntent]   = useState('');
  const [result, setResult]   = useState('');
  const [loading, setLoading] = useState(false);

  const PRESETS = [
    'Maximize safe yield with my USDC',
    'Minimize risk, stable returns only',
    'Aggressive yield, I accept higher risk',
  ];

  async function submitIntent() {
    if (!intent.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/intent', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ intent }),
      });
      const json = await res.json();
      setResult(json.message ?? 'Intent queued for next agent cycle.');
    } catch {
      setResult('Intent queued — agent will act on next cycle.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass" style={{ padding: 20 }}>
      <p className="panel-title">Set Intent</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Tell the agent what you want. It will act automatically on the next cycle.
      </p>

      {/* Preset chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setIntent(p)}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 100,
              border: `1px solid ${intent === p ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
              background: intent === p ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: intent === p ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="e.g. Maximize safe yield with my 100 USDC"
        rows={2}
        style={{
          width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text)',
          fontFamily: 'var(--font-sans)', resize: 'none', outline: 'none',
          marginBottom: 10, lineHeight: 1.5,
        }}
      />

      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={submitIntent}
        disabled={loading || !intent.trim()}
      >
        {loading ? 'Submitting…' : 'Submit Intent →'}
      </button>

      {result && (
        <div style={{
          marginTop: 10, padding: '10px 14px', background: 'var(--bg-input)',
          border: '1px solid var(--border)', borderRadius: 8,
          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
        }}>
          {result}
        </div>
      )}
    </div>
  );
}

// ── Bridge panel ──────────────────────────────────────────────────────────────

function BridgePanel() {
  const { openDeposit, address } = useInterwovenKit();
  return (
    <div className="glass" style={{ padding: 20 }}>
      <p className="panel-title">Interwoven Bridge</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
        Bridge assets from Initia testnet into NEURALIS before depositing.
      </p>
      <button
        className="btn-ghost"
        style={{ fontSize: 13 }}
        onClick={() => openDeposit({ denoms: [bridgeDenom], chainId: process.env.NEXT_PUBLIC_INTERWOVEN_CHAIN_ID ?? 'neuralis-1' })}
        disabled={!address}
      >
        Open Bridge ↗
      </button>
    </div>
  );
}

// ── Vault form ────────────────────────────────────────────────────────────────

function VaultForm() {
  const [tab, setTab]       = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const { address } = useAccount();
  const { approve, deposit, redeem, userSharesRaw, assetAddress, isDepositing, isRedeeming, isApproving } = useVault();

  const allowance = useReadContract({
    address: assetAddress, abi: ERC20_ABI, functionName: 'allowance',
    args: address ? [address, vaultManagerConfig.address] : undefined,
    query: { enabled: !!address && !!assetAddress },
  });
  const usdcBalance = useReadContract({
    address: assetAddress, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!assetAddress },
  });

  async function handleDeposit() {
    if (!amount) return;
    setStatus('');
    try {
      const amountBig = BigInt(Math.floor(Number(amount) * 1e6));
      if ((allowance.data ?? BigInt(0)) < amountBig) {
        setStatus('Approving…');
        await approve(amountBig);
        await allowance.refetch();
      }
      setStatus('Depositing…');
      await deposit(amount);
      setStatus('✓ Deposited');
      setAmount('');
    } catch (e: unknown) {
      setStatus('Error: ' + (e instanceof Error ? e.message.slice(0, 80) : String(e)));
    }
  }

  async function handleRedeem() {
    if (!amount && !userSharesRaw) return;
    setStatus('Withdrawing…');
    try {
      const sharesAmount = amount ? BigInt(Math.floor(Number(amount) * 1e6)) : userSharesRaw!;
      await redeem(sharesAmount);
      setStatus('✓ Withdrawn');
      setAmount('');
    } catch (e: unknown) {
      setStatus('Error: ' + (e instanceof Error ? e.message.slice(0, 80) : String(e)));
    }
  }

  const maxUSDC   = usdcBalance.data !== undefined ? formatUnits(usdcBalance.data, 6) : '0';
  const maxShares = userSharesRaw !== undefined ? formatUnits(userSharesRaw, 6) : '0';

  return (
    <div className="glass" style={{ padding: 20 }}>
      <p className="panel-title">Actions</p>

      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {(['deposit', 'withdraw'] as const).map((t) => (
          <button key={t} className={`tab-item${tab === t ? ' active' : ''}`}
            onClick={() => { setTab(t); setAmount(''); setStatus(''); }}>
            {t === 'deposit' ? '↓ Deposit' : '↑ Withdraw'}
          </button>
        ))}
      </div>

      {tab === 'deposit' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="label">Amount USDC</span>
            <button onClick={() => setAmount(maxUSDC)}
              style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              MAX {Number(maxUSDC).toFixed(2)}
            </button>
          </div>
          <input className="field-input" type="number" min="0" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)} style={{ marginBottom: 14 }} />
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleDeposit} disabled={isDepositing || isApproving || !amount}>
            {isApproving ? 'Approving…' : isDepositing ? 'Depositing…' : 'Deposit USDC'}
          </button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="label">Shares (NYV)</span>
            <button onClick={() => setAmount(maxShares)}
              style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              MAX {Number(maxShares).toFixed(4)}
            </button>
          </div>
          <input className="field-input" type="number" min="0" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)} style={{ marginBottom: 14 }} />
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleRedeem} disabled={isRedeeming || (!amount && !userSharesRaw)}>
            {isRedeeming ? 'Withdrawing…' : 'Withdraw'}
          </button>
        </>
      )}

      {status && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {status}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, mono, live }: { label: string; value: string; mono?: boolean; live?: boolean }) {
  return (
    <div>
      <p className="label" style={{ marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: mono ? 100 : 300, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', color: live ? 'var(--green)' : 'var(--text)' }}>
        {live && <span style={{ fontSize: 8, marginRight: 6, verticalAlign: 'middle' }}>●</span>}
        {value}
      </p>
    </div>
  );
}
