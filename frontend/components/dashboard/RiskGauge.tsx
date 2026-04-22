'use client';

export const RiskGauge = () => {
  const score = 17;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col p-8 bg-white/[0.02] panel h-full">
      <div className="flex items-center justify-between mb-8">
         <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.24em]">Risk Overview</span>
         <span className="text-[10px] text-white/30 font-bold uppercase underline tracking-widest cursor-pointer hover:text-white/60">View Report</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
         <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Background Ring */}
            <svg className="w-full h-full -rotate-90">
               <circle
                 cx="80"
                 cy="80"
                 r={radius}
                 fill="transparent"
                 stroke="rgba(255,255,255,0.03)"
                 strokeWidth="8"
               />
               <circle
                 cx="80"
                 cy="80"
                 r={radius}
                 fill="transparent"
                 stroke="#10b981"
                 strokeWidth="8"
                 strokeDasharray={circumference}
                 strokeDashoffset={offset}
                 strokeLinecap="round"
                 className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
               />
            </svg>
            
            {/* Score Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-4xl font-bold tracking-tighter text-white/94">{score}</span>
               <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Low Risk</span>
            </div>
         </div>

         <div className="mt-8 w-full space-y-4">
            <div className="flex items-center justify-between">
               <span className="text-[11px] font-bold text-white/20 uppercase tracking-widest">Risk Score</span>
               <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">17/100</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
               <span className="text-[11px] font-bold text-white/20 uppercase tracking-widest">Exposure</span>
               <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">$24.82M</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
               <span className="text-[11px] font-bold text-white/20 uppercase tracking-widest">VaR (24H)</span>
               <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">$128.42K</span>
            </div>
         </div>
      </div>
    </div>
  );
};
