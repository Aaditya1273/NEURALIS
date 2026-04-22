'use client';

import { useInterwovenKit } from '@initia/interwovenkit-react';

export const ControlCenterHeader = () => {
  const { address, username } = useInterwovenKit();

  return (
    <div className="border-b border-white/[0.08] bg-[#050508]">
      <div className="h-16 flex items-center justify-between px-10">
        
        {/* Left: System ID */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
             <span className="text-[13px] font-bold tracking-[0.24em] text-white uppercase">Control Layer</span>
          </div>
          <div className="h-6 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-8 text-[12px] font-mono font-bold tracking-widest text-white/40">
             <span className="flex items-center gap-2">
                NETWORK <span className="text-emerald-400">OPERATIONAL</span>
             </span>
             <span className="flex items-center gap-2">
                BPS <span className="text-white/80">1,402</span>
             </span>
             <span className="flex items-center gap-2">
                HEIGHT <span className="text-white/80">#1,294,082</span>
             </span>
          </div>
        </div>

        {/* Right: Root Identity */}
        <div className="flex items-center gap-8">
           {address && (
              <div className="flex items-center gap-6">
                 <div className="text-[12px] font-mono font-bold tracking-widest text-white/20 uppercase">
                    Session_Auth
                 </div>
                 <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] px-4 py-1.5 panel">
                    <span className="text-[13px] font-bold text-white/90">
                       {username || 'ROOT_USER'}
                    </span>
                    <span className="text-[13px] font-mono text-white/40">
                       {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                 </div>
              </div>
           )}
           <div className="flex items-center gap-2 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 font-bold uppercase tracking-widest rounded-sm">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              Secure
           </div>
        </div>

      </div>
    </div>
  );
};
