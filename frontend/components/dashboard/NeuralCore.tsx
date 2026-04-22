'use client';

import { motion } from 'framer-motion';

export const NeuralCore = () => {
  return (
    <div className="relative w-full aspect-square flex items-center justify-center p-8 bg-black/40 panel-monolith mb-10 overflow-hidden group">
      {/* Background - Pure Achromatic Case */}
      <div className="absolute inset-0 bg-white/[0.01]" />
      
      {/* ── Technical Wireframe Sphere ────────────────────────────────── */}
      <div className="relative w-32 h-32">
        {/* Inner Core - Static Pass */}
        <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
           <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
        </div>

        {/* Orbit Rings - Static Machined Hardware */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 border border-white/[0.08] rounded-full"
            style={{ 
              transform: `rotateX(${45 * i}deg) rotateY(${45 * i}deg)` 
            }}
          />
        ))}
      </div>

      {/* Authority Labeling - Institutional Standard */}
      <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-1">
         <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono text-emerald-500/80 font-bold uppercase tracking-[0.3em]">Core_Active</span>
         </div>
      </div>
    </div>
  );
};
