import { useState } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

export default function ReportsDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('ESG Summary');
  const [selectedTemplate, setSelectedTemplate] = useState('ESG Summary');
  
  // Custom Filter State Repositories
  const [filters, setFilters] = useState({
    dateRange: 'Q2 2026',
    department: 'All Departments',
    module: 'All Modules',
    employee: 'All Personnel',
    challenge: 'All Challenges',
    esgCategory: 'All Categories'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportLogs, setReportLogs] = useState([
    { id: 'REP-091', name: 'Q1 Corporate Carbon Ledger', type: 'Environmental', Format: 'PDF', date: '2026-04-10', size: '4.2 MB' },
    { id: 'REP-092', name: 'DEI Workforce Mix Disclosure', type: 'Social', Format: 'Excel', date: '2026-05-18', size: '1.8 MB' },
    { id: 'REP-093', name: 'Global Audit Signoff Matrix', type: 'Governance', Format: 'CSV', date: '2026-06-02', size: '840 KB' },
  ]);

  // Design Tokens (Slate Neutral Charcoal)
  const charcoalPrimary = "#334155"; 
  const charcoalAccent = "#475569";

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRunReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const newId = `REP-${Math.floor(100 + Math.random() * 900)}`;
      const newLog = {
        id: newId,
        name: `Custom ${filters.module} Asset (${filters.dateRange})`,
        type: filters.module === 'All Modules' ? 'Integrated ESG' : filters.module,
        Format: 'PDF',
        date: new Date().toISOString().split('T')[0],
        size: '1.1 MB'
      };
      setReportLogs([newLog, ...reportLogs]);
      alert(`🚀 Query Engine Compiled Successfully!\nCreated item record target: ${newId}`);
    }, 1100);
  };

  const templates = [
    {
      id: 'Environmental',
      title: 'Environmental Report',
      desc: 'Scope 1/2/3 greenhouse gas footprints, mitigation milestones, supply chain metrics, and physical asset indices.',
      meta: 'Emissions Data • Carbon Targets • Vendor & Product Footprints'
    },
    {
      id: 'Social',
      title: 'Social Report',
      desc: 'Demographic representation indexes, community CSR investments, and health & safety compliance criteria log files.',
      meta: 'Diversity Benchmarks • CSR Engagement • Training Completion'
    },
    {
      id: 'Governance',
      title: 'Governance Report',
      desc: 'Whistleblower parameters, insider risk matrices, business ethics disclosure criteria, and procedural internal audit logs.',
      meta: 'Policy Affirmation • Internal Audits • Risk Summaries'
    },
    {
      id: 'ESG Summary',
      title: 'ESG Summary Profile',
      desc: 'Executive-level data rollups evaluating consolidated cross-departmental scoring performance indexes.',
      meta: '4 Framework Scores • Department Cross-Comparisons • Board Metrics'
    }
  ];

  return (
    <div className="p-6 min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col gap-6">
      
      {/* BRAND HEADER CANVAS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <span style={{ color: charcoalPrimary }}></span> Corporate Analytics & Custom Report Builder
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Compile fully certified ESG disclosure sheets, cross-examine data metrics, or configure pipeline queries.
          </p>
        </div>
      </div>

      {/* 1. TOP SUB-NAVIGATION TABS */}
      

      {/* 2. STANDARD REPORT TEMPLATES DECK GRID */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-1">Standard Report Templates Deck</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {templates.map((tmpl) => (
            <div 
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl.id)}
              className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:scale-[1.01] ${
                selectedTemplate === tmpl.id ? 'border-slate-700 ring-2 ring-slate-200' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-black text-slate-950 tracking-tight text-sm">{tmpl.title}</h4>
                  <div className={`w-3 h-3 rounded-full ${selectedTemplate === tmpl.id ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{tmpl.desc}</p>
              </div>
              <div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-4">
                  <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wide mb-0.5">Payload Scope</span>
                  <span className="text-[11px] font-bold text-slate-700 leading-tight block">{tmpl.meta}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Compiling preformatted template asset for: ${tmpl.title}`);
                  }}
                  className="w-full text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: charcoalPrimary }}
                >
                  Generate Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CUSTOM REPORT BUILDER (FILTER ARRAY CONTROLS) */}
      <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-black text-slate-950 tracking-tight flex items-center gap-2">
            🛠️ Custom Query Builder & Pipeline Filters
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure customized constraints across data modules to run targeted analytics arrays.
          </p>
        </div>

        {/* Dropdown Input Grid Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Date Range</label>
            <select 
              value={filters.dateRange} 
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="Q1 2026">Q1 2026</option>
              <option value="Q2 2026">Q2 2026</option>
              <option value="Full Year 2025">Full Year 2025</option>
              <option value="Custom Window">Custom Window ▾</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Department</label>
            <select 
              value={filters.department} 
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="All Departments">All Departments ▾</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Logistics">Logistics Division</option>
              <option value="Corporate HQ">Corporate HQ</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Module Repo</label>
            <select 
              value={filters.module} 
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="All Modules">All Modules ▾</option>
              <option value="Environmental">Environmental</option>
              <option value="Social">Social</option>
              <option value="Governance">Governance</option>
              <option value="Gamification">Gamification</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Employee Track</label>
            <select 
              value={filters.employee} 
              onChange={(e) => handleFilterChange('employee', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="All Personnel">All Personnel ▾</option>
              <option value="Sarah Jenkins">Sarah Jenkins</option>
              <option value="Aditi Rao">Aditi Rao</option>
              <option value="Michael Chang">Michael Chang</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Challenge Event</label>
            <select 
              value={filters.challenge} 
              onChange={(e) => handleFilterChange('challenge', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="All Challenges">All Challenges ▾</option>
              <option value="Sustainability Sprint">Sustainability Sprint</option>
              <option value="Recycle Drive">Recycle Drive</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">ESG Category</label>
            <select 
              value={filters.esgCategory} 
              onChange={(e) => handleFilterChange('esgCategory', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="All Categories">All Categories ▾</option>
              <option value="Carbon Footprint">Carbon Footprint</option>
              <option value="Labor Mix">Labor Mix</option>
              <option value="Audit Compliance">Audit Compliance</option>
            </select>
          </div>
        </div>

        {/* 4. ACTION EXECUTION HUB CONTROL BAR */}
        <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRunReport}
              disabled={isGenerating}
              className="text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-sm transition-all hover:opacity-95 flex items-center gap-2 disabled:opacity-50 min-w-[130px] justify-center"
              style={{ backgroundColor: charcoalPrimary }}
            >
              {isGenerating ? (
                <span className="animate-pulse">Compiling...</span>
              ) : (
                <><span>▶</span> Run Query</>
              )}
            </button>
          </div>

          {/* Targeted File Generation Handlers */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2">Export Formats:</span>
            <button 
              onClick={() => alert(`Exporting current criteria selection matrix out to PDF layout framework.`)}
              className="bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 shadow-xs transition-colors"
            >
              📄 PDF
            </button>
            <button 
              onClick={() => alert(`Exporting raw table schemas directly to .xlsx sheet array.`)}
              className="bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 shadow-xs transition-colors"
            >
              📈 Excel
            </button>
            <button 
              onClick={() => alert(`Streaming raw flat-file comma-delimited data packets out to .csv format.`)}
              className="bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 shadow-xs transition-colors"
            >
              🔢 CSV
            </button>
          </div>
        </div>
      </div>

      {/* 5. HISTORICAL COMPILED DATA LEDGER LOGS */}
      <BentoGlowEffect glowColor="71, 85, 105" spotlightRadius={300} className="p-1">
        <div className="overflow-x-auto border border-slate-300 rounded-2xl bg-white shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Recently Evaluated Output Registers</h4>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">Total Logs: {reportLogs.length}</span>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-400 font-black text-xs uppercase">
              <tr>
                <th className="p-4">Report Token ID</th>
                <th className="p-4">Asset Label Designation</th>
                <th className="p-4">Structural Type</th>
                <th className="p-4">Compiled Date</th>
                <th className="p-4">Payload Size</th>
                <th className="p-4 text-center">Action Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {reportLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500 font-bold">{log.id}</td>
                  <td className="p-4 text-slate-900 font-black">{log.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 border border-slate-200 rounded text-xs text-slate-600 bg-slate-50">
                      {log.type}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">{log.date}</td>
                  <td className="p-4 font-mono text-xs text-slate-600">{log.size}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => alert(`Downloading artifact stream container for package record: ${log.id}`)}
                      className="text-xs font-black underline hover:text-slate-950 transition-colors"
                      style={{ color: charcoalAccent }}
                    >
                      Download {log.Format}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoGlowEffect>

      {/* REWARDS AND INCENTIVES COMPLIANCE CONSOLE FOOTER */}
      <div className="mt-auto pt-4 border-t border-slate-200 flex items-center text-xs text-slate-700 font-bold italic bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span className="mr-2 font-black text-sm select-none" style={{ color: charcoalAccent }}>🛡️</span>
        <span>All analytical records compiled here adhere directly to security protocols for audit preparation standards.</span>
      </div>

    </div>
  );
}