import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import BentoGlowEffect from './BentoGlowEffect';

export default function ScoreCard({ title, score, max = 100, glowColor, metricColor, isOverall = false }) {
  return (
    <BentoGlowEffect glowColor={glowColor} className="bg-white border border-slate-200/50 shadow-xs hover:shadow-xl transition-all duration-300">
      <div className="p-6 h-full flex flex-col justify-between cursor-pointer group">
        <div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{title}</h3>
            <span className="p-1.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white border border-slate-100 transition-all duration-300">
              <ArrowUpRight size={12} />
            </span>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-extrabold tracking-tight ${metricColor}`}>{score}</span>
            <span className="text-xs font-semibold text-slate-300">/ {max}</span>
          </div>
        </div>

        {/* Adaptive Context Gauge Bar */}
        <div className="w-full bg-slate-100 h-1 rounded-full mt-6 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${(score / max) * 100}%`,
              backgroundColor: `rgb(${glowColor})`
            }}
          />
        </div>
      </div>
    </BentoGlowEffect>
  );
}