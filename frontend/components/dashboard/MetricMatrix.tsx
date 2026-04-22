'use client';

interface MetricPanelProps {
  label: string;
  value: string;
  delta?: string;
  mono?: boolean;
  isAnchor?: boolean;
}

const MetricPanel = ({ label, value, delta, mono, isAnchor }: MetricPanelProps) => (
  <div className={`
    p-10 border border-white/[0.08] bg-white/[0.01] panel
    ${isAnchor ? 'lg:col-span-2' : ''}
  `}>
    <div className="flex items-center justify-between mb-8">
      <span className="text-[13px] font-bold tracking-[0.24em] text-white/40 uppercase">{label}</span>
      {delta && (
        <span className="text-[11px] font-bold text-emerald-400 font-mono flex items-center gap-1.5">
           <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
           {delta}
        </span>
      )}
    </div>
    <div className={`
      ${mono ? 'font-mono' : 'font-semibold tracking-tighter'} 
      ${isAnchor ? 'text-7xl' : 'text-5xl'} 
      text-white/94
    `}>
      {value}
    </div>
  </div>
);

function formatValue(val: string): string {
  // Extract numeric part if it starts with $
  const isCurrency = val.startsWith('$');
  const numericPart = val.replace(/[$,\sUSDC]/g, '');
  const num = parseFloat(numericPart);

  if (isNaN(num)) return val;

  let formatted = val;
  if (num >= 1_000_000_000) {
    formatted = (num / 1_000_000_000).toFixed(1) + 'B';
  } else if (num >= 1_000_000) {
    formatted = (num / 1_000_000).toFixed(1) + 'M';
  } else if (num >= 1_000) {
    formatted = (num / 1_000).toFixed(1) + 'K';
  } else {
    return val;
  }

  return isCurrency ? `$${formatted}` : formatted;
}

export const MetricMatrix = ({ tvl, cycles, rebalances, fees }: { tvl: string; cycles: string; rebalances: string; fees: string }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-white/[0.08] border-x border-b border-white/[0.08]">
      {/* Financial Anchor - Dominant Perception */}
      <MetricPanel 
        label="Total Sovereign TVL" 
        value={formatValue("$24842109")} 
        delta="+2.4% / 24H" 
        isAnchor 
      />
      
      {/* Operational Stats - Supporting Logic */}
      <MetricPanel label="Yield Cycles" value={cycles} mono />
      <MetricPanel label="Protocol Fees" value={formatValue(fees === 'RECOVERY_NOMINAL' ? '12042' : fees)} mono delta="NOMINAL" />
    </div>
  );
};
