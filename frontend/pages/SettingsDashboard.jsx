import { useState } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

export default function SettingsDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('Departments');
  const [selectedRowId, setSelectedRowId] = useState(null);

  // --- MOCK REGISTRY 1: DEPARTMENTS MATRIX ---
  const [departments] = useState([
    { id: 1, name: "Manufacturing & Operations", code: "MFG-01", head: "Marcus Vance", parent: "Global Production", employees: 142, status: "Active" },
    { id: 2, name: "Logistics & Supply Chain", code: "LOG-04", head: "Elena Rostova", parent: "Corporate Operations", employees: 68, status: "Active" },
    { id: 3, name: "Corporate HQ Admin", code: "HQ-MAIN", head: "Sarah Jenkins", parent: "Executive Board", employees: 35, status: "Active" },
    { id: 4, name: "Sustainability Labs", code: "SUS-LAB", head: "Aditi Rao", parent: "R&D Division", employees: 12, status: "Active" },
  ]);

  // --- MOCK REGISTRY 2: CATEGORIES MATRIX ---
  const [categories] = useState([
    { id: 101, code: "ENV-GHG", name: "Greenhouse Gas Emissions", pillar: "Environmental", weighting: "35%", lastReviewed: "2026-02-14", status: "Active" },
    { id: 102, code: "SOC-DEI", name: "Diversity, Equity & Inclusion", pillar: "Social", weighting: "25%", lastReviewed: "2026-03-20", status: "Active" },
    { id: 103, code: "GOV-AUD", name: "Internal Audit Compliance", pillar: "Governance", weighting: "20%", lastReviewed: "2026-05-11", status: "Active" },
    { id: 104, code: "ENV-WTR", name: "Water & Waste Stewardship", pillar: "Environmental", weighting: "20%", lastReviewed: "2026-01-30", status: "Active" },
  ]);

  // --- MOCK REGISTRY 3: REGULATORY REPORTING SCHEMAS ---
  const [esgFrameworks] = useState([
    { id: "FW-GRI", name: "Global Reporting Initiative", type: "Framework Baseline", scope: "Universal ESG Matrix", alignment: "94% Sync", status: "Active" },
    { id: "FW-SASB", name: "Sustainability Accounting Standards Board", type: "Industry Standard", scope: "Financial Materiality", alignment: "88% Sync", status: "Active" },
    { id: "FW-BRSR", name: "Business Responsibility & Sustainability", type: "Regulatory Mandate", scope: "Compliance Scope 1-3", alignment: "100% Sync", status: "Active" },
  ]);

  // --- MOCK REGISTRY 4: NOTIFICATION CHANNELS ---
  const [notificationRules] = useState([
    { id: "NOT-01", event: "Critical Non-Compliance Flag", group: "Legal & Board Auditors", method: "Email + Slack Hook", latency: "Instant", status: "Active" },
    { id: "NOT-02", event: "Gamification Milestone Unlocked", group: "All Personnel Nodes", method: "In-App Console Feed", latency: "Hourly Batch", status: "Active" },
    { id: "NOT-03", event: "Monthly Footprint Signoff Required", group: "Department Unit Heads", method: "Email Digest", latency: "24h Reminder", status: "Active" },
  ]);

  // --- GLOBAL SYSTEM BOOLEAN TOGGLES MATRIX ---
  const [systemConfig, setSystemConfig] = useState({
    autoEmissionCalc: true,    
    requireCsrEvidence: true,  
    autoAwardBadges: false,     
    emailComplianceAlerts: true 
  });

  // Design Tokens (Industrial Charcoal Style)
  const graphitePrimary = "#334155";
  const graphiteAccent = "#475569";

  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSelectedRowId(null);
  };

  const handleToggleSwitch = (key) => {
    setSystemConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAction = (actionType) => {
    if (!selectedRowId && actionType !== 'create') {
      alert(`Please select a specific row target inside the ${activeSubTab} ledger matrix first.`);
      return;
    }
    alert(`Executing [${actionType.toUpperCase()}] command packet on ${activeSubTab} payload row instance ID: ${selectedRowId || 'NEW_ROW_ALLOCATION'}`);
  };

  return (
    <div className="p-6 min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col gap-6">
      
      {/* BRAND HEADER CANVAS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <span style={{ color: graphitePrimary }}></span> Configuration & Administration Center
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage organizational trees, update baseline index frameworks, adjust alerting triggers, and toggle system pipeline automation hooks.
          </p>
        </div>
      </div>

      {/* 1. TOP SUB-NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-300 pb-2 overflow-x-auto">
        {['Departments', 'Categories', 'ESG Configuration', 'Notification Settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === tab 
                ? 'text-white shadow-sm font-black' 
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 border-b-0'
            }`}
            style={activeSubTab === tab ? { backgroundColor: graphitePrimary } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. ROW-LEVEL MATRIX UNIVERSAL CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleAction('create')}
            className="text-white px-4 py-2 rounded-xl font-black text-xs shadow-sm transition-all uppercase hover:opacity-90"
            style={{ backgroundColor: graphitePrimary }}
          >
            + New {activeSubTab === 'ESG Configuration' ? 'Framework' : activeSubTab === 'Notification Settings' ? 'Alert Rule' : activeSubTab.slice(0, -1)}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleAction('edit')}
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 px-4 py-2 rounded-xl font-black text-xs transition-colors uppercase"
          >
            ✏️ Edit Selected
          </button>
          <button 
            onClick={() => handleAction('delete')}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-4 py-2 rounded-xl font-black text-xs transition-colors uppercase"
          >
            🗑️ Delete Record
          </button>
        </div>
      </div>

      {/* 3. CORE MATRIX ENGINE CHASSIS ROUTER */}
      
      {/* ================= VIEW 1: DEPARTMENTS MATRIX ================= */}
      {activeSubTab === 'Departments' && (
        <BentoGlowEffect glowColor="51, 65, 85" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4">Department Unit Name</th>
                  <th className="p-4">Code Ref</th>
                  <th className="p-4">Operational Head</th>
                  <th className="p-4">Parent Dept Hierarchy</th>
                  <th className="p-4 text-center">Active Headcount</th>
                  <th className="p-4 text-center">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {departments.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    style={selectedRowId === row.id ? { backgroundColor: 'rgba(51, 65, 85, 0.05)' } : {}}
                    onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRowId === row.id} 
                        onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                        className="rounded border-slate-400 focus:ring-slate-500"
                        style={{ color: graphitePrimary }}
                      />
                    </td>
                    <td className="p-4 font-black text-slate-950">{row.name}</td>
                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{row.code}</td>
                    <td className="p-4 text-slate-800">{row.head}</td>
                    <td className="p-4 text-slate-400 text-xs font-bold">{row.parent}</td>
                    <td className="p-4 text-center font-mono font-black text-slate-900">{row.employees} employees</td>
                    <td className="p-4 text-center">
                      <span className="bg-green-50 text-green-700 border border-green-300 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 2: CATEGORIES MATRIX ================= */}
      {activeSubTab === 'Categories' && (
        <BentoGlowEffect glowColor="51, 65, 85" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4">Category Tracking Parameter</th>
                  <th className="p-4">Structural Code</th>
                  <th className="p-4">Core ESG Pillar</th>
                  <th className="p-4 text-center">Global Metric Weighting</th>
                  <th className="p-4">Last Governance Audit</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {categories.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    style={selectedRowId === row.id ? { backgroundColor: 'rgba(51, 65, 85, 0.05)' } : {}}
                    onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRowId === row.id} 
                        onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                        className="rounded border-slate-400 focus:ring-slate-500"
                        style={{ color: graphitePrimary }}
                      />
                    </td>
                    <td className="p-4 font-black text-slate-950">{row.name}</td>
                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{row.code}</td>
                    <td className="p-4">
                      <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        row.pillar === 'Environmental' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        row.pillar === 'Social' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {row.pillar}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-black text-slate-900">{row.weighting}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{row.lastReviewed}</td>
                    <td className="p-4 text-center">
                      <span className="bg-green-50 text-green-700 border border-green-300 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 3: ESG CONFIGURATION FRAMEWORKS ================= */}
      {activeSubTab === 'ESG Configuration' && (
        <BentoGlowEffect glowColor="51, 65, 85" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4">Compliance Framework Registry</th>
                  <th className="p-4">System ID</th>
                  <th className="p-4">Disclosure Standard Type</th>
                  <th className="p-4">Reporting Scope Coverage</th>
                  <th className="p-4 text-center">Data Mapping Alignment</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {esgFrameworks.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    style={selectedRowId === row.id ? { backgroundColor: 'rgba(51, 65, 85, 0.05)' } : {}}
                    onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRowId === row.id} 
                        onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                        className="rounded border-slate-400 focus:ring-slate-500"
                        style={{ color: graphitePrimary }}
                      />
                    </td>
                    <td className="p-4 font-black text-slate-950">{row.name}</td>
                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{row.id}</td>
                    <td className="p-4 text-slate-700 font-medium">{row.type}</td>
                    <td className="p-4 text-slate-400 text-xs font-bold">{row.scope}</td>
                    <td className="p-4 text-center font-mono font-black text-slate-900">{row.alignment}</td>
                    <td className="p-4 text-center">
                      <span className="bg-green-50 text-green-700 border border-green-300 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 4: NOTIFICATION SETTINGS ================= */}
      {activeSubTab === 'Notification Settings' && (
        <BentoGlowEffect glowColor="51, 65, 85" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4">System Trigger Event</th>
                  <th className="p-4">Rule Code</th>
                  <th className="p-4">Target Recipient Group</th>
                  <th className="p-4">Dispatch Methods</th>
                  <th className="p-4 text-center">Throttle Latency</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {notificationRules.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    style={selectedRowId === row.id ? { backgroundColor: 'rgba(51, 65, 85, 0.05)' } : {}}
                    onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRowId === row.id} 
                        onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                        className="rounded border-slate-400 focus:ring-slate-500"
                        style={{ color: graphitePrimary }}
                      />
                    </td>
                    <td className="p-4 font-black text-slate-950">{row.event}</td>
                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{row.id}</td>
                    <td className="p-4 text-slate-800">{row.group}</td>
                    <td className="p-4 text-slate-500 font-mono text-xs">{row.method}</td>
                    <td className="p-4 text-center text-slate-900 font-black text-xs">{row.latency}</td>
                    <td className="p-4 text-center">
                      <span className="bg-green-50 text-green-700 border border-green-300 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* 4. GLOBAL ESG SYSTEM CONFIGURATION SWITCHES */}
      <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-5 mt-4">
        <div>
          <h3 className="text-sm font-black text-slate-950 tracking-tight flex items-center gap-2">
            ⚡ Cross-Module Automation Engine Rules
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure system backend hooks and boolean triggers across operational pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* SWITCH 1: ENVIRONMENTAL CALCULATOR */}
          <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all">
            <div className="space-y-0.5 max-w-[85%]">
              <label className="text-xs font-black text-slate-950 tracking-tight block">Enable auto emission calculation</label>
              <span className="text-[11px] text-slate-500 font-medium block leading-tight">
                Automatically convert verified utility bill metrics and telemetry payloads directly into Scope 1/2/3 CO₂ metrics.
              </span>
            </div>
            <button 
              onClick={() => handleToggleSwitch('autoEmissionCalc')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${systemConfig.autoEmissionCalc ? 'bg-slate-700' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${systemConfig.autoEmissionCalc ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* SWITCH 2: SOCIAL CSR VERIFICATION */}
          <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all">
            <div className="space-y-0.5 max-w-[85%]">
              <label className="text-xs font-black text-slate-950 tracking-tight block">Require evidence for all CSR activities</label>
              <span className="text-[11px] text-slate-500 font-medium block leading-tight">
                Locks down employee tracking until a valid document image, PDF certificate, or geolocated photo packet is validated.
              </span>
            </div>
            <button 
              onClick={() => handleToggleSwitch('requireCsrEvidence')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${systemConfig.requireCsrEvidence ? 'bg-slate-700' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${systemConfig.requireCsrEvidence ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* SWITCH 3: GAMIFICATION ENGINE HOOK */}
          <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all">
            <div className="space-y-0.5 max-w-[85%]">
              <label className="text-xs font-black text-slate-950 tracking-tight block">Auto-award badges on challenge completion</label>
              <span className="text-[11px] text-slate-500 font-medium block leading-tight">
                Instantly process points distribution and issue verified digital badges to employee profiles when metrics cross target boundaries.
              </span>
            </div>
            <button 
              onClick={() => handleToggleSwitch('autoAwardBadges')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${systemConfig.autoAwardBadges ? 'bg-slate-700' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${systemConfig.autoAwardBadges ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* SWITCH 4: GOVERNANCE ESCALATION ALERTING */}
          <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all">
            <div className="space-y-0.5 max-w-[85%]">
              <label className="text-xs font-black text-slate-950 tracking-tight block">Email alerts for new compliance issues</label>
              <span className="text-[11px] text-slate-500 font-medium block leading-tight">
                Trigger real-time critical escalation pathways out to legal teams and board auditors the instant a non-compliance vector is indexed.
              </span>
            </div>
            <button 
              onClick={() => handleToggleSwitch('emailComplianceAlerts')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${systemConfig.emailComplianceAlerts ? 'bg-slate-700' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${systemConfig.emailComplianceAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

        </div>
      </div>

      {/* SYSTEM METRICS / SECURE SIGNATURE COMPLIANCE CONSOLE FOOTER */}
      <div className="mt-auto pt-4 border-t border-slate-200 flex items-center text-xs text-slate-700 font-bold italic bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span className="mr-2 font-black text-sm select-none" style={{ color: graphiteAccent }}>🔒</span>
        <span>Administrative actions are structurally appended directly to system audit logs under secure hash protection.</span>
      </div>

    </div>
  );
}