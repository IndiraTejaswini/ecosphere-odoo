import React from 'react';
import { CheckCircle2, AlertTriangle, Cpu, Bookmark, ArrowUpRight } from 'lucide-react';

export default function RecentActivity() {
  const actions = [
    { text: 'Priya completed "Zero Waste Week" Challenge', desc: 'Automatic XP token validation process applied successfully[cite: 1].', time: '4m ago', icon: <CheckCircle2 size={16} className="text-emerald-600" /> },
    { text: 'New compliance exception flagged in Logistics operations', desc: 'Audit marker generated due to outstanding policy validation timeline boundaries[cite: 1].', time: '1h ago', icon: <AlertTriangle size={16} className="text-amber-600" /> },
    { text: '42 structural automated Carbon Transactions cataloged', desc: 'Continuous manufacturing stream integration executed via system configuration toggles[cite: 1].', time: '2h ago', icon: <Cpu size={16} className="text-slate-600" /> },
    { text: 'Corporate Affairs revised Governance Compliance metrics', desc: 'New operational weights mapped into the persistent system ledger framework[cite: 1].', time: '4h ago', icon: <Bookmark size={16} className="text-[#163fa1]" /> },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200/50 shadow-xs h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight sm:text-xl">Live Operational Log</h3>
          <p className="text-sm text-slate-400 font-medium mt-0.5">Real-time ledger audit entries generated across internal nodes[cite: 1].</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">Live Stream</span>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {actions.map((act, idx) => (
          <div 
            key={idx}
            className="flex items-start gap-5 p-5 rounded-2xl bg-slate-50/40 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/80 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group/row hover:shadow-2xs"
          >
            <span className="h-11 w-11 rounded-xl bg-white flex items-center justify-center border border-slate-200/40 shadow-3xs group-hover/row:scale-110 group-hover/row:border-blue-200 group-hover/row:shadow-md transition-all shrink-0">
              {act.icon}
            </span>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-slate-800 group-hover/row:text-[#163fa1] transition-colors truncate">{act.text}</p>
                <span className="text-xs font-mono text-slate-400 whitespace-nowrap bg-white border border-slate-200/40 px-2.5 py-0.5 rounded-md shadow-3xs">{act.time}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium group-hover/row:text-slate-500 transition-colors">{act.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}