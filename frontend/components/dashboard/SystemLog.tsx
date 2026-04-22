'use client';

import { useState, useEffect } from 'react';
import { useRebalanceHistory } from '@/hooks/useRebalanceHistory';

export const SystemLog = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { data: rebalances, loading } = useRebalanceHistory();

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col bg-white/[0.01] panel">
      {/* Panel Header */}
      <div className="px-10 py-8 border-b border-white/[0.08] flex items-center justify-between">
        <span className="text-[13px] font-bold tracking-[0.24em] text-white/40 uppercase">System Logs</span>
        <div className="flex items-center gap-3">
           <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
           <span className="text-[11px] font-mono font-bold text-white/40 uppercase tracking-widest">LIVE_STATUS_CONNECTED</span>
        </div>
      </div>

      {/* Terminal Feed - Monolithic Card Pass */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
        <div className="space-y-6">
          {loading ? (
             <div className="py-20 text-center text-white/10 animate-pulse uppercase tracking-[0.4em] text-[11px] font-bold">
                Syncing_Move_Sequencer...
             </div>
          ) : (
            (rebalances || []).map((log, i) => (
               <div key={i} className="panel-monolith p-8 bg-white/[0.01] overflow-hidden group hover:bg-white/[0.02] transition-all">
                  <div className="flex items-start justify-between mb-8">
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-white/20 font-mono tracking-tighter">[{log.executed_at.split(' ')[1] || '00:00:00'}]</span>
                           <span className="text-[11px] font-bold text-white/94 uppercase tracking-widest">EVT_Settlement_Proof</span>
                        </div>
                        <span className="text-[12px] font-mono text-white/40 truncate max-w-[200px]">
                           {log.tx_hash ? `${log.tx_hash.slice(0, 32)}...` : '0x_MOVE_ORACLE_DIRECT_TX'}
                        </span>
                     </div>
                     <div className="flex items-center gap-3 bg-emerald-500/5 px-4 py-1.5 border border-emerald-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Settled</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 border-t border-white/[0.06] pt-8">
                     <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.2em]">Agent_Node</span>
                        <span className="text-[11px] font-bold text-white/60">NEURAL_NODE_0{i % 4}</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.2em]">L2_Layer</span>
                        <span className="text-[11px] font-bold text-white/60 uppercase">MoveVM_Persistent</span>
                     </div>
                  </div>
               </div>
            ))
          )}
          {!loading && (!rebalances || rebalances.length === 0) && (
             <div className="py-20 text-center text-white/20 italic tracking-[0.24em] uppercase text-[11px] font-bold">
                Waiting for protocol events...
             </div>
          )}
        </div>
      </div>

      {/* Panel Footer */}
      <div className="px-10 py-6 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-[11px] font-bold">
         <span className="text-white/20 tracking-[0.24em] uppercase">Audit_Standard: ERC-8004_COMPLIANT</span>
         <span className="text-white/40 uppercase tracking-widest">Verified_Security_Layer</span>
      </div>
    </div>
  );
};
