'use client';

import { motion } from 'framer-motion';

export const AgentNetwork = () => {
  return (
    <div className="flex flex-col p-8 bg-white/[0.02] panel h-full">
      <div className="flex items-center justify-between mb-8">
         <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.24em]">Agent Network</span>
         <span className="text-[10px] text-white/30 font-bold uppercase underline tracking-widest cursor-pointer hover:text-white/60">View All</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
         <div className="relative w-40 h-40">
            {/* Theoretical Neural Web */}
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
               {[...Array(8)].map((_, i) => {
                 const angle = (i * 360) / 8;
                 const x = 50 + 40 * Math.cos((angle * Math.PI) / 180);
                 const y = 50 + 40 * Math.sin((angle * Math.PI) / 180);
                 return (
                   <g key={i}>
                     <motion.circle 
                       cx={x} cy={y} r="2" fill="#3b82f6" 
                       animate={{ opacity: [0.2, 0.8, 0.2] }}
                       transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                     />
                     <line x1="50" y1="50" x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                   </g>
                 );
               })}
               <circle cx="50" cy="50" r="10" fill="transparent" stroke="#3b82f6" strokeWidth="1" className="animate-pulse" />
               <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)]" />
            </div>
         </div>

         <div className="mt-8 w-full space-y-4 font-bold uppercase tracking-widest">
            <div className="flex items-center justify-between">
               <span className="text-[11px] text-white/20">Total Agents</span>
               <span className="text-[11px] text-white/70">48</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
               <span className="text-[11px] text-white/20">Active</span>
               <span className="text-[11px] text-white/70">46</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
               <span className="text-[11px] text-emerald-400">Sync Status</span>
               <span className="text-[11px] text-emerald-400">98.6%</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
               <span className="text-[11px] text-white/20">Network Load</span>
               <span className="text-[11px] text-white/70">34%</span>
            </div>
         </div>
      </div>
    </div>
  );
};
