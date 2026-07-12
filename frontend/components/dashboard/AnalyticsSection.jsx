import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';

export default function AnalyticsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-100"><TrendingUp size={16} /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Emissions Trend</h3>
              <p className="text-[11px] text-slate-400">Carbon output analytics (12 mo)[cite: 1]</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100/40">-14.2% YoY</span>
        </div>
        <div className="h-44 w-full flex items-end justify-between pt-4 relative">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path d="M0,35 Q15,18 30,24 T60,14 T90,26 T100,12" fill="none" stroke="#059669" strokeWidth="1.5" className="path-animation" />
          </svg>
          <div className="absolute left-0 right-0 top-0 border-t border-dashed border-slate-100 text-[9px] text-slate-400 pt-1">Target Threshold</div>
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-100/50"></div>
          <span className="text-[10px] font-medium text-slate-400">Q1</span>
          <span className="text-[10px] font-medium text-slate-400">Q2</span>
          <span className="text-[10px] font-medium text-slate-400">Q3</span>
          <span className="text-[10px] font-medium text-slate-400">Q4</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-100"><BarChart3 size={16} /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Department Index</h3>
              <p className="text-[11px] text-slate-400">Comparative multi-department ESG scales[cite: 1]</p>
            </div>
          </div>
        </div>
        <div className="h-44 flex items-end justify-around gap-4 pt-2">
          {[
            { dept: 'Sales', val: 'h-[55%]', score: 62 },
            { dept: 'Mfg', val: 'h-[80%]', score: 85 },
            { dept: 'Logi', val: 'h-[68%]', score: 72 },
            { dept: 'Corp', val: 'h-[90%]', score: 92 },
            { dept: 'R&D', val: 'h-[62%]', score: 68 },
          ].map((bar, i) => (
            <div key={i} className="flex flex-col items-center w-full group cursor-pointer">
              <div className={`w-full ${bar.val} bg-slate-100 group-hover:bg-slate-800 rounded-t-lg transition-all duration-300`} />
              <span className="text-[11px] text-slate-400 font-medium mt-2 group-hover:text-slate-800 transition-colors">{bar.dept}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}