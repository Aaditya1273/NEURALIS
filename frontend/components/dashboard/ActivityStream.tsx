'use client';

import { RebalanceHistory } from '@/components/RebalanceHistory';
import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export const AnimatedDivider = () => (
  <div className="relative h-px overflow-hidden" aria-hidden>
    <motion.div
      className="absolute inset-y-0 left-0 right-0"
      style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)" }}
      initial={{ scaleX: 0, originX: 0.5 }}
      whileInView={{ scaleX: 1 }}
      transition={{ duration: 1.4, ease: EASE }}
      viewport={{ once: true }}
    />
  </div>
);

export const ActivityStream = () => {
  return (
    <>
      <section className="py-24 relative bg-[#050508]">
         {/* Deep Depth Glow */}
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] pointer-events-none" />

         <div className="container px-6 lg:px-12 relative z-10">
           <div className="flex flex-col lg:grid lg:grid-cols-[450px_1fr] gap-20 items-start">
             
             {/* Section Meta — No Italics */}
             <div className="lg:sticky lg:top-32">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(37,99,235,1)]" />
                  <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/30">Audit Trail</span>
               </div>
               <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-8">History & Proof</h2>
               <p className="text-white/40 text-lg md:text-xl tracking-tight leading-relaxed mb-12 max-w-sm">
                  A cryptographically proven stream of agent actions. Every rebalance is a transaction settled on the NEURALIS sequencer.
               </p>
               <div className="p-8 border border-white/5 rounded-sm bg-white/[0.01]">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-3 font-mono">Sequencer Health</p>
                  <p className="text-emerald-500 font-mono text-sm tracking-tight uppercase font-bold">OPERATIONAL · 100% UPTIME</p>
               </div>
             </div>

             {/* Rebalance History Visual — Sharp Corners */}
             <div className="w-full">
               <div className="bg-white/[0.01] border border-white/5 p-2 relative overflow-hidden rounded-sm group">
                  <div className="p-10 pb-6 flex items-center justify-between border-b border-white/5 mb-8">
                     <p className="text-[11px] uppercase tracking-[0.4em] font-black text-white/20">Institutional Ledger</p>
                     <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-mono text-white/10 uppercase tracking-widest">Live Sync Alpha</span>
                     </div>
                  </div>
                  <div className="max-h-[700px] overflow-y-auto px-10 pb-12 custom-scrollbar">
                     <RebalanceHistory />
                  </div>
               </div>
             </div>
           </div>
         </div>
      </section>
      <AnimatedDivider />
    </>
  );
};
