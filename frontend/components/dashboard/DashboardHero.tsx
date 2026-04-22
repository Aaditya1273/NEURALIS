'use client';

import { useInterwovenKit } from '@initia/interwovenkit-react';
import { motion } from 'framer-motion';

interface DashboardHeroProps {
  autoSignActive: boolean;
  autoSignRemaining: number;
}

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

export const DashboardHero = ({ autoSignActive, autoSignRemaining }: DashboardHeroProps) => {
  const { address, username } = useInterwovenKit();

  return (
    <>
      <section className="relative pt-16 pb-20 overflow-hidden bg-[#050508]">
        {/* Sublte Grid Matching Landing Page */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 10%, transparent 100%)",
          }}
        />

        <div className="container px-6 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-8">
                 <div className="h-px w-8 bg-white/20" />
                 <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/40">Sovereign Environment Alpha</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8"
                style={{
                  background: "linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.45) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                Portfolio Overview
              </h1>
              <p className="text-white/50 text-xl tracking-tight max-w-2xl leading-relaxed">
                Autonomous agent fleet synchronization. Real-time orchestration of financial intelligence across the Interwoven stack.
              </p>
            </div>

            <div className="flex flex-col items-end gap-4">
               {address && (
                  <div className="flex items-center gap-2">
                    {username && (
                      <div className="text-[11px] font-bold text-white/90 bg-white/5 border border-white/10 rounded-sm px-4 py-2 hover:bg-white/10 transition-colors">
                        {username}
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-white/30 bg-white/5 border border-white/10 rounded-sm px-4 py-2">
                      {address.slice(0, 10)}...{address.slice(-6)}
                    </div>
                  </div>
               )}
               
               <div className={`flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] rounded-sm px-4 py-2 border transition-all duration-500 ${
                  autoSignActive 
                    ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' 
                    : 'text-white/20 bg-white/5 border-white/5'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    autoSignActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse' : 'bg-white/10'
                  }`} />
                  {autoSignActive
                    ? `AUTO-SIGN ACTIVE · ${autoSignRemaining}H`
                    : 'SESSION INACTIVE'}
               </div>
            </div>
          </div>
        </div>
      </section>
      <AnimatedDivider />
    </>
  );
};
