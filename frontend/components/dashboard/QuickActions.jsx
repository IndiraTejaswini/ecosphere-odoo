import React from 'react';
import { Fingerprint, Layers, Shield, ArrowRight } from 'lucide-react';

export default function QuickActions() {
  const shortactions = [
    { label: 'Log Operational Stream Data', icon: <Fingerprint size={18} />, tag: 'ERP', color: 'group-hover/btn:text-emerald-600 bg-emerald-50/50 group-hover/btn:bg-emerald-50' },
    { label: 'Append Active System Objective', icon: <Layers size={18} />, tag: 'GOAL', color: 'group-hover/btn:text-sky-600 bg-sky-50/50 group-hover/btn:bg-sky-50' },
    { label: 'Extract Standard Regulatory Audit', icon: <Shield size={18} />, tag: 'COMP', color: 'group-hover/btn:text-[#A10559] bg-pink-50/50 group-hover/btn:bg-pink-50' },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200/60 h-full flex flex-col justify-between group hover:shadow-2xs transition-all duration-300">
      <div className="mb-8">
        <h3 className="text-lg font-black text-[#0f2438] tracking-tight sm:text-xl">Shortcut Matrix</h3>
        <p className="text-sm text-slate-400 font-medium mt-0.5">Bypass pathways to prompt transaction endpoints.</p>
      </div>
      
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {shortactions.map((btn, idx) => (
          <button
            key={idx}
            className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-200/60 bg-slate-50/40 hover:bg-slate-50 text-left active:scale-[0.98] transition-all duration-200 group/btn cursor-pointer hover:shadow-3xs hover:border-slate-300"
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className={`h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 group-hover/btn:scale-110 border border-transparent group-hover/btn:border-slate-200/60 transition-all shrink-0 ${btn.color}`}>
                {btn.icon}
              </span>
              <span className="text-sm font-bold text-slate-600 group-hover/btn:text-[#0f2438] transition-colors truncate">
                {btn.label}
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono font-bold bg-white px-2.5 py-1 rounded-md border border-slate-200/40 text-slate-400 tracking-wider shadow-3xs group-hover/btn:bg-[#0f2438] group-hover/btn:text-white group-hover/btn:border-transparent transition-all">
                {btn.tag}
              </span>
              <ArrowRight size={14} className="text-slate-300 group-hover/btn:text-[#A10559] group-hover/btn:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}