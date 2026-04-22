'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: 'May 08', value: 20.1 },
  { time: 'May 09', value: 21.5 },
  { time: 'May 10', value: 20.8 },
  { time: 'May 11', value: 22.4 },
  { time: 'May 12', value: 23.9 },
  { time: 'May 13', value: 24.82 },
  { time: 'May 14', value: 24.82 },
];

export const PerformanceChart = () => {
  return (
    <div className="h-full flex flex-col p-10 bg-white/[0.01]">
      {/* Chart Header - Precision Pass */}
      <div className="flex items-start justify-between mb-12">
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-bold text-white/40 uppercase tracking-[0.4em]">Capital_Performance_Index</span>
          <div className="flex items-baseline gap-4">
             <span className="text-6xl font-semibold tracking-tighter text-white/94">$24.82M</span>
             <span className="text-[14px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                +2.48%_24H
             </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold text-white/20">
              <span>Peak: $25.1M</span>
              <span className="w-px h-2 bg-white/10" />
              <span>Velocity: 12.4%</span>
           </div>
        </div>
      </div>

      {/* Chart Viewport - Intentional Density Pass */}
      <div className="flex-1 w-full min-h-[350px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Execution Pickets - Visual Proof Layer */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
            
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}
              dy={20}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(val) => `$${val}M`}
            />
            <Tooltip 
              contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
              cursor={{ stroke: 'rgba(59,130,246,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            
            {/* Sync Markers - Simulated rebalance events */}
            {[2, 4, 5].map((idx) => (
              <Area 
                key={idx}
                type="monotone" 
                dataKey="value" 
                stroke="transparent"
                fill="transparent"
                className="opacity-0"
              />
            ))}

            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Float Overlays - Eliminating Dead Space */}
        <div className="absolute top-0 right-0 flex flex-col gap-4 items-end pointer-events-none">
           <div className="p-4 bg-white/[0.02] border border-white/[0.08] flex flex-col gap-1 panel">
              <span className="text-[9px] font-bold text-white/10 tracking-[0.2em] uppercase">Volatility_Index</span>
              <span className="text-[12px] font-mono text-emerald-400 font-bold tracking-tighter">LOW_0.024</span>
           </div>
           <div className="p-4 bg-white/[0.02] border border-white/[0.08] flex flex-col gap-1 panel">
              <span className="text-[9px] font-bold text-white/10 tracking-[0.2em] uppercase">Yield_Efficiency</span>
              <span className="text-[12px] font-mono text-white/60 font-bold tracking-tighter">98.24%</span>
           </div>
        </div>
      </div>
    </div>
  );
};
