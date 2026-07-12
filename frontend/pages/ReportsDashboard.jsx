import { useState, useEffect } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- BACKEND CONNECTION ---
import api from '../api';

// Backend custom-report filter only understands these 3 modules (no
// "Gamification" option exists server-side - unrecognized values silently
// fall back to 'environmental').
const REPORT_MODULES = ['environmental', 'social', 'governance'];

function getDateRangeBounds(label) {
  if (label === 'Q1 2026') return { dateFrom: '2026-01-01', dateTo: '2026-03-31' };
  if (label === 'Q2 2026') return { dateFrom: '2026-04-01', dateTo: '2026-06-30' };
  if (label === 'Full Year 2025') return { dateFrom: '2025-01-01', dateTo: '2025-12-31' };
  return null; // 'Custom Window' - handled via customDateFrom/customDateTo instead
}

export default function ReportsDashboard() {
  const [selectedTemplate, setSelectedTemplate] = useState('ESG Summary');

  // --- BACKEND CONNECTION: real filter option data ---
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [csrCategories, setCsrCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [filters, setFilters] = useState({
    dateRange: 'Q2 2026',
    customDateFrom: '',
    customDateTo: '',
    department: '',
    module: 'environmental',
    employee: '',
    challenge: '',
    esgCategory: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  // No backend model stores report history - this is an in-session-only log,
  // populated with REAL record counts from real API calls (starts empty
  // rather than pre-seeded with fake rows that don't correspond to anything).
  const [reportLogs, setReportLogs] = useState([]);

  const charcoalPrimary = '#334155';
  const charcoalAccent = '#475569';

  async function loadFilterOptions() {
    setLoading(true);
    setLoadError('');
    try {
      const [deptRes, challengesRes, categoriesRes] = await Promise.all([
        api.departments.list({ limit: 100 }),
        api.challenges.list({ limit: 100 }),
        api.categories.list({ limit: 100 }),
      ]);
      setDepartments(deptRes.data);
      setChallenges(challengesRes.data);
      setCsrCategories(categoriesRes.data.filter((c) => c.type === 'CSR Activity'));

      try {
        const { data } = await api.employees.list({ limit: 100 });
        setEmployees(data);
      } catch {
        setEmployees([]); // non-admin - employee filter just won't be available
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load report filter options');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  function buildFilterParams(moduleOverride) {
    const dateBounds = filters.dateRange === 'Custom Window'
      ? { dateFrom: filters.customDateFrom, dateTo: filters.customDateTo }
      : getDateRangeBounds(filters.dateRange);

    return {
      department: filters.department || undefined,
      module: moduleOverride || filters.module,
      dateFrom: dateBounds?.dateFrom,
      dateTo: dateBounds?.dateTo,
      employee: filters.employee || undefined,
      challenge: filters.challenge || undefined,
      esgCategory: filters.esgCategory || undefined,
    };
  }

  function pushLog(name, type, params, format = 'PDF', recordCount) {
    const newLog = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      name,
      type,
      Format: format,
      date: new Date().toISOString().split('T')[0],
      recordCount,
      params,
    };
    setReportLogs((prev) => [newLog, ...prev]);
  }

  // --- BACKEND CONNECTION: Run Query (custom report builder) ---
  async function handleRunReport() {
    setIsGenerating(true);
    try {
      const params = buildFilterParams();
      const result = await api.reports.custom(params);
      pushLog(`Custom ${params.module} Report (${filters.dateRange})`, params.module, params, 'CSV', result.count);
      alert(`🚀 Query complete — ${result.count} matching record(s) found.`);
    } catch (err) {
      alert(err.message || 'Report query failed');
    } finally {
      setIsGenerating(false);
    }
  }

  // --- BACKEND CONNECTION: Standard template "Generate Report" ---
  async function handleGenerateTemplate(templateId) {
    try {
      if (templateId === 'ESG Summary') {
        const result = await api.reports.esgScore();
        alert(`ESG Summary: organization overall score ${result.organizationOverallScore}/100 across ${result.departments.length} department(s).`);
        pushLog('ESG Summary Profile', 'ESG Summary', {}, 'PDF', result.departments.length);
      } else {
        const moduleParam = templateId.toLowerCase();
        const params = { module: moduleParam };
        const result = await api.reports.custom(params);
        pushLog(`${templateId} Report`, templateId, params, 'CSV', result.count);
        alert(`✅ ${templateId} Report compiled — ${result.count} record(s).`);
      }
    } catch (err) {
      alert(err.message || 'Report generation failed');
    }
  }

  // --- BACKEND CONNECTION: Export buttons (current filter state) ---
  async function handleExport(format) {
    try {
      const params = buildFilterParams();
      if (format === 'pdf') await api.reports.exportPdf(params);
      else if (format === 'excel') await api.reports.exportExcel(params);
      else await api.reports.exportCsv(params);
    } catch (err) {
      alert(err.message || 'Export failed');
    }
  }

  // --- BACKEND CONNECTION: re-download a historical log entry using its saved filter snapshot ---
  async function handleDownloadLog(log) {
    try {
      const fmt = (log.Format || 'csv').toLowerCase();
      if (fmt === 'pdf') await api.reports.exportPdf(log.params);
      else if (fmt === 'excel') await api.reports.exportExcel(log.params);
      else await api.reports.exportCsv(log.params);
    } catch (err) {
      alert(err.message || 'Download failed');
    }
  }

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

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-bold text-sm">Loading report filters...</div>;
  }

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

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl px-6 py-4">
          ⚠️ {loadError}
        </div>
      )}

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
                    handleGenerateTemplate(tmpl.id);
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
            {filters.dateRange === 'Custom Window' && (
              <div className="flex gap-1 mt-1.5">
                <input type="date" value={filters.customDateFrom} onChange={(e) => handleFilterChange('customDateFrom', e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px] w-full" />
                <input type="date" value={filters.customDateTo} onChange={(e) => handleFilterChange('customDateTo', e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px] w-full" />
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Department</label>
            <select 
              value={filters.department} 
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="">All Departments ▾</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Module Repo</label>
            <select 
              value={filters.module} 
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              {REPORT_MODULES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Employee Track</label>
            <select 
              value={filters.employee} 
              onChange={(e) => handleFilterChange('employee', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="">All Personnel ▾</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
            {employees.length === 0 && <p className="text-[10px] text-amber-600 font-bold mt-1">Requires admin access</p>}
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Challenge Event</label>
            <select 
              value={filters.challenge} 
              onChange={(e) => handleFilterChange('challenge', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="">All Challenges ▾</option>
              {challenges.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
            <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ No effect currently - backend data model gap</p>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">ESG Category</label>
            <select 
              value={filters.esgCategory} 
              onChange={(e) => handleFilterChange('esgCategory', e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold w-full focus:ring-1 focus:ring-slate-500 outline-none"
            >
              <option value="">All Categories ▾</option>
              {csrCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Only applies when Module = Social</p>
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
              onClick={() => handleExport('pdf')}
              className="bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 shadow-xs transition-colors"
            >
              📄 PDF
            </button>
            <button 
              onClick={() => handleExport('excel')}
              className="bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 shadow-xs transition-colors"
            >
              📈 Excel
            </button>
            <button 
              onClick={() => handleExport('csv')}
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
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Recently Evaluated Output Registers (this session)</h4>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">Total Logs: {reportLogs.length}</span>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-400 font-black text-xs uppercase">
              <tr>
                <th className="p-4">Report Token ID</th>
                <th className="p-4">Asset Label Designation</th>
                <th className="p-4">Structural Type</th>
                <th className="p-4">Compiled Date</th>
                <th className="p-4">Records</th>
                <th className="p-4 text-center">Action Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {reportLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-bold">
                    No reports run yet this session - use "Generate Report" above or "Run Query" below.
                  </td>
                </tr>
              ) : (
                reportLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{log.id}</td>
                    <td className="p-4 text-slate-900 font-black">{log.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 border border-slate-200 rounded text-xs text-slate-600 bg-slate-50">
                        {log.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{log.date}</td>
                    <td className="p-4 font-mono text-xs text-slate-600">{log.recordCount ?? '—'}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDownloadLog(log)}
                        className="text-xs font-black underline hover:text-slate-950 transition-colors"
                        style={{ color: charcoalAccent }}
                      >
                        Download {log.Format}
                      </button>
                    </td>
                  </tr>
                ))
              )}
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