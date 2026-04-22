'use client';

import { AllocationChart } from '@/components/AllocationChart';
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

interface AllocationConsoleProps {
  allocationData: any[];
}

export const AllocationConsole = ({ allocationData }: AllocationConsoleProps) => {
  return (
    <>
      <section className="py-24 bg-black/10">
        <div className="container px-6 lg:px-12">
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_450px] gap-20 items-center">
            
            {/* Chart Context — No Italics */}
            <div className="order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-8">Strategy Orchestration</h2>
              <p className="text-white/40 text-lg md:text-xl tracking-tight leading-relaxed max-w-xl mb-12">
                The neuralis agent fleet dynamically adjusts credit flow across validated vault strategies. Real-time reallocation anchored by MoveVM settlement.
              </p>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-3">Primary Bias</p>
                  <p className="text-white font-mono text-lg tracking-tight">STABLE_YIELD_01</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-3">Risk profile</p>
                  <p className="text-emerald-500 font-mono text-lg tracking-tight uppercase">NOMINAL_HEDGED</p>
                </div>
              </div>
            </div>

            {/* Allocation Chart Visual — Sharp Corners */}
            <div className="order-1 lg:order-2 w-full">
              <div className="bg-white/[0.02] border border-white/5 p-10 relative overflow-hidden group rounded-sm">
                <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <div className="flex items-center justify-between mb-12">
                   <p className="text-[11px] uppercase tracking-[0.4em] font-black text-white/40">Execution Map</p>
                   <div className="flex gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                     <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                   </div>
                </div>
                
                <div className="relative">
                  <AllocationChart data={allocationData} />
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
