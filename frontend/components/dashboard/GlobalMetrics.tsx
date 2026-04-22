'use client';

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

interface MetricProps {
  label: string;
  value: string;
  mono?: boolean;
}

const Metric = ({ label, value, mono }: MetricProps) => (
  <div className="group relative">
    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-3 group-hover:text-white/40 transition-colors duration-500">
      {label}
    </p>
    <p className={`${mono ? 'font-mono' : 'font-bold tracking-tighter'} text-3xl md:text-4xl text-white transition-transform duration-500`}>
      {value}
    </p>
  </div>
);

export const GlobalMetrics = ({ tvl, cycles, rebalances, fees }: { tvl: string; cycles: string; rebalances: string; fees: string }) => {
  return (
    <>
      <section className="py-24 relative overflow-hidden bg-[#050508]">
        {/* Deep Depth Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand/5 blur-[140px] pointer-events-none" />

        <div className="container px-6 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-20 lg:items-center">
            
            {/* Active Asset Anchor — Sharp Corners */}
            <div className="lg:w-1/3">
              <div className="bg-white/[0.02] border border-white/5 p-10 relative overflow-hidden group rounded-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <p className="text-[11px] uppercase tracking-[0.4em] font-black text-white/40 mb-6">Anchor Liquidity</p>
                <div className="flex items-baseline gap-3">
                   <span className="text-6xl font-bold tracking-tighter text-white">
                      {tvl.split(' ')[0]}
                   </span>
                   <span className="text-xl font-bold text-white/60 uppercase tracking-widest">{tvl.split(' ')[1]}</span>
                </div>
                <div className="h-px w-full bg-white/5 my-8" />
                <p className="text-sm text-white/20 tracking-tight">Global TVL deployed across autonomous yield strategies.</p>
              </div>
            </div>

            {/* Secondary Institutional Stats */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
              <Metric label="Protocol Cycles" value={cycles} mono />
              <Metric label="Active Rebalances" value={rebalances} mono />
              <Metric label="Protocol Revenue" value={fees} mono />
            </div>
          </div>
        </div>
      </section>
      <AnimatedDivider />
    </>
  );
};
