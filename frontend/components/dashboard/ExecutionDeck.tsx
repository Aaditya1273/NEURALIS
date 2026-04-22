'use client';

import { AllocationMatrix } from '@/components/AllocationMatrix';

interface ExecutionDeckProps {
  allocationData: any[];
}

export const ExecutionDeck = ({ allocationData }: ExecutionDeckProps) => {
  return (
    <div className="h-full flex flex-col bg-white/[0.01] panel">
      {/* Panel Header */}
      <div className="px-10 py-8 border-b border-white/[0.08] flex items-center justify-between">
        <span className="text-[13px] font-bold tracking-[0.24em] text-white/40 uppercase">Execution Deck</span>
        <div className="flex items-center gap-6 text-[11px] font-bold text-white/20 tracking-wider">
           <span className="flex items-center gap-2">
             <span className="w-1 h-1 rounded-full bg-emerald-500" />
             TOTAL_CONNECTED_STRATEGIES: 04
           </span>
           <span className="text-white/40">SYSTEM_READY</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0">
        {/* Technical Data Table */}
        <div className="p-10 border-r border-white/[0.08]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="pb-6 text-[11px] uppercase tracking-[0.24em] text-white/40 font-bold">Strategy_ID</th>
                <th className="pb-6 text-[11px] uppercase tracking-[0.24em] text-white/40 font-bold">Yield_Proof</th>
                <th className="pb-6 text-[11px] uppercase tracking-[0.24em] text-white/40 font-bold text-right">Settlement_L2</th>
              </tr>
            </thead>
            <tbody className="text-[13px] font-medium">
              {[
                { id: 'STABLE_BTC_01', apy: '12.4%', tx: '0x1A_..._F2', color: '#ffffff' },
                { id: 'ETH_DELTA_N',   apy: '18.1%', tx: '0x3D_..._A1', color: '#ffffff' },
                { id: 'SOL_LIQ_PRO',   apy: '24.2%', tx: '0xE8_..._C4', color: '#ffffff' },
                { id: 'AVAX_AGENT_X',  apy: '9.8%',  tx: '0xBD_..._09', color: '#ffffff' },
              ].map((s) => (
                <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                  <td className="py-6 text-white/90 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <span className="font-bold tracking-tight">{s.id}</span>
                  </td>
                  <td className="py-6 text-white/90 font-bold">{s.apy} <span className="text-[10px] text-white/20 ml-1">NET</span></td>
                  <td className="py-6 text-white/50 text-right font-mono text-[11px] uppercase tracking-tighter">{s.tx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual Allocation Matrix */}
        <div className="bg-black/20 flex flex-col items-center">
            <AllocationMatrix data={allocationData} />
        </div>
      </div>
    </div>
  );
};
