'use client';

interface MetricItemProps {
  label: string;
  value: string;
  subValue?: string;
  delta?: string;
  isPositive?: boolean;
}

const MetricItem = ({ label, value, subValue, delta, isPositive = true }: MetricItemProps) => (
  <div className="flex-1 p-6 border-r border-white/[0.08] bg-white/[0.01] panel last:border-r-0">
    <span className="block text-[11px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">
      {label}
    </span>
    <div className="flex items-baseline gap-3 mb-1">
      <span className="text-3xl font-semibold tracking-tighter text-white/94">{value}</span>
      {delta && (
        <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'} font-mono`}>
          {isPositive ? '▲' : '▼'} {delta}
        </span>
      )}
    </div>
    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
      {subValue}
    </div>
  </div>
);

export interface MetricStripData {
  tvl: string;
  apy: string;
  activeStrategies: number | string;
  totalRebalances: number | string;
}

interface MetricStripProps {
  data?: MetricStripData;
  isLoading?: boolean;
}

export const MetricStrip = ({ data, isLoading }: MetricStripProps) => {
  return (
    <div className="flex bg-white/[0.04] border-b border-white/[0.08] overflow-x-auto custom-scrollbar no-scrollbar">
      <div className="flex-none w-10 border-r border-white/[0.08] bg-white/[0.01]" /> {/* Alignment Gutter */}
      
      <MetricItem 
        label="Total Value Locked" 
        value={isLoading ? '—' : `$${data?.tvl ?? '0.00'}M`} 
        subValue="Live_On_Chain"
      />
      <MetricItem 
        label="Target APY" 
        value={isLoading ? '—' : `${data?.apy ?? '0.00'}%`} 
        subValue="Aggregated_Returns"
      />
      <MetricItem 
        label="Active Strategies" 
        value={isLoading ? '—' : String(data?.activeStrategies ?? '0')} 
        subValue="All_Systems_Active"
      />
      <MetricItem 
        label="Total Rebalances" 
        value={isLoading ? '—' : String(data?.totalRebalances ?? '0')} 
        subValue="Move_VM_Executions"
      />
    </div>
  );
};
