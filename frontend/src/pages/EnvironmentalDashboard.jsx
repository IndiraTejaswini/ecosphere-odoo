import  { useState } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- MOCK TRANS-DATA & MASTER PROFILES FROM PLATFORM BUSINESS METRICS ---
const INITIAL_EMISSION_FACTORS = [
  { id: 1, category: "Electricity (Grid)", scope: "Scope 2", factor: "0.85", unit: "kg CO₂e/kWh", source: "EPA 2026", status: "Active" },
  { id: 2, category: "Diesel Fuel (Fleet)", scope: "Scope 1", factor: "2.68", unit: "kg CO₂e/liter", source: "DEFRA", status: "Active" },
  { id: 3, category: "Natural Gas (Heating)", scope: "Scope 1", factor: "1.91", unit: "kg CO₂e/m³", source: "IPCC", status: "Active" },
];

const INITIAL_PRODUCT_PROFILES = [
  { id: 1, sku: "ECO-BOX-01", name: "Recycled Kraft Packaging", material: "Corrugated Cardboard", footprint: "0.24", unit: "kg CO₂e/unit", rating: "A+" },
  { id: 2, sku: "SLM-PLAS-44", name: "Polyethylene Stretch Wrap", material: "Virgin LDPE", footprint: "1.85", unit: "kg CO₂e/kg", rating: "C-" },
  { id: 3, sku: "BIO-TAPE-09", name: "Water-Activated Paper Tape", material: "Kraft Paper / Starch", footprint: "0.12", unit: "kg CO₂e/roll", rating: "A" },
];

const INITIAL_TRANSACTIONS = [
  { id: 1, date: "2026-07-10", sourceRecord: "PO-99482 (Logistics Fleet)", type: "Fleet Diesel Fuel", usage: "1,200 L", calculatedEmissions: "3.21 t", status: "Auto-Calculated" },
  { id: 2, date: "2026-07-08", sourceRecord: "MFG-BATCH-808", type: "Facility Electricity", usage: "45,000 kWh", calculatedEmissions: "38.25 t", status: "Auto-Calculated" },
  { id: 3, date: "2026-07-05", sourceRecord: "EXP-MARCH-VEND", type: "Procurement Cargo Run", usage: "450 L", calculatedEmissions: "1.20 t", status: "Auto-Calculated" },
];

const INITIAL_GOALS = [
  { id: 1, name: "Reduce Fleet Emissions", department: "Logistics", targetCo2: 500, currentCo2: 390, deadline: "2026-12-31", status: "Active" },
  { id: 2, name: "Cut Packaging Waste", department: "Manufacturing", targetCo2: 120, currentCo2: 98, deadline: "2026-09-30", status: "On Track" },
  { id: 3, name: "Office Energy Cut", department: "Corporate", targetCo2: 80, currentCo2: 80, deadline: "2026-06-30", status: "Completed" }
];

export default function EnvironmentalDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('Environmental Goals');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Clear tracking references whenever changing view scopes to avoid conflict cross-contamination
  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSearchTerm('');
    setSelectedRowId(null);
  };

  // --- DYNAMIC SWITCH RENDER LAYOUT CONDITIONAL BLOCKS ---
  return (
    <div className="p-6 min-h-screen bg-slate-50 text-slate-900">
      
      {/* 1. SUB TABS SECTION NAVIGATION */}
      <div className="flex space-x-2 border-b border-slate-300 mb-6 pb-2 overflow-x-auto">
        {['Emission Factors', 'Product ESG Profiles', 'Carbon Transactions', 'Environmental Goals'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === tab 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 border-b-0'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. DYNAMIC BENTO CONTENT CANVAS WRAPPER */}
      <BentoGlowEffect glowColor="34, 197, 94" spotlightRadius={260} className="p-2">
        
        {/* ACTION ROW HEADER UTILITIES */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center flex-wrap gap-2">
            <button 
              onClick={() => alert(`+ New item entry configuration workflow for: ${activeSubTab}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-all"
            >
              + New {activeSubTab.replace('Environmental ', '').replace('s', '')}
            </button>
            <button 
              disabled={!selectedRowId}
              onClick={() => alert(`Modify Entry Target Frame ID: ${selectedRowId}`)}
              className={`px-4 py-2 rounded font-bold text-sm transition-all border ${
                selectedRowId ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              Edit
            </button>
            <button 
              disabled={!selectedRowId}
              onClick={() => {
                alert(`Purging targeted record entry structural node ID: ${selectedRowId}`);
                setSelectedRowId(null);
              }}
              className={`px-4 py-2 rounded font-bold text-sm transition-all border ${
                selectedRowId ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              Delete
            </button>
            <button 
              onClick={() => alert(`Exporting current dataset matrix summary via CSV payload dump`)}
              className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded font-bold text-sm border border-slate-300 transition-all shadow-sm"
            >
              Export ▾
            </button>
          </div>

          <div>
            <input
              type="text"
              placeholder={`Filter through ${activeSubTab.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        {/* 3. DYNAMIC METRIC VIEW DATA VIEWS SPLIT */}
        <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
          
          {/* ================= VIEW: EMISSION FACTORS ================= */}
          {activeSubTab === 'Emission Factors' && (
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">GHG Source Category</th>
                  <th className="p-4">Scope Level</th>
                  <th className="p-4 text-right">Calculation Factor</th>
                  <th className="p-4">Metric Formula Unit</th>
                  <th className="p-4">Regulatory Source Authority</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {INITIAL_EMISSION_FACTORS.filter(ef => ef.category.toLowerCase().includes(searchTerm.toLowerCase())).map((ef) => (
                  <tr key={ef.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedRowId === ef.id ? 'bg-emerald-50/70' : ''}`} onClick={() => setSelectedRowId(ef.id === selectedRowId ? null : ef.id)}>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === ef.id} onChange={() => setSelectedRowId(ef.id === selectedRowId ? null : ef.id)} className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td className="p-4 font-black">{ef.category}</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 text-xs rounded">{ef.scope}</span></td>
                    <td className="p-4 text-right font-mono text-emerald-700">{ef.factor}</td>
                    <td className="p-4 font-mono text-slate-600 text-xs">{ef.unit}</td>
                    <td className="p-4 text-slate-700">{ef.source}</td>
                    <td className="p-4 text-center"><span className="text-xs bg-green-50 text-green-700 border border-green-300 font-bold px-2 py-0.5 rounded-full">{ef.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ================= VIEW: PRODUCT ESG PROFILES ================= */}
          {activeSubTab === 'Product ESG Profiles' && (
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Product SKU</th>
                  <th className="p-4">Eco-Profile Name</th>
                  <th className="p-4">Primary Component Material</th>
                  <th className="p-4 text-right">Lifecycle Carbon Footprint</th>
                  <th className="p-4">Unit Scope</th>
                  <th className="p-4 text-center">Eco-Rating Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {INITIAL_PRODUCT_PROFILES.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedRowId === p.id ? 'bg-emerald-50/70' : ''}`} onClick={() => setSelectedRowId(p.id === selectedRowId ? null : p.id)}>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === p.id} onChange={() => setSelectedRowId(p.id === selectedRowId ? null : p.id)} className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td className="p-4 font-mono text-slate-600 text-xs">{p.sku}</td>
                    <td className="p-4 font-black">{p.name}</td>
                    <td className="p-4 text-slate-700">{p.material}</td>
                    <td className="p-4 text-right font-mono text-red-600">{p.footprint}</td>
                    <td className="p-4 font-mono text-slate-500 text-xs">{p.unit}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-black border ${p.rating.startsWith('A') ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>{p.rating}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ================= VIEW: CARBON TRANSACTIONS ================= */}
          {activeSubTab === 'Carbon Transactions' && (
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Transaction Date</th>
                  <th className="p-4">Linked ERP Source Record Origin</th>
                  <th className="p-4">Activity Category Scope</th>
                  <th className="p-4 text-right">Operational Log Usage</th>
                  <th className="p-4 text-right">Calculated Emissions Output</th>
                  <th className="p-4 text-center">Integration Ledger Pipe Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {INITIAL_TRANSACTIONS.filter(t => t.sourceRecord.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
                  <tr key={t.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedRowId === t.id ? 'bg-emerald-50/70' : ''}`} onClick={() => setSelectedRowId(t.id === selectedRowId ? null : t.id)}>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === t.id} onChange={() => setSelectedRowId(t.id === selectedRowId ? null : t.id)} className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td className="p-4 font-mono text-slate-500 text-xs">{t.date}</td>
                    <td className="p-4 font-bold text-slate-900">{t.sourceRecord}</td>
                    <td className="p-4 text-slate-700">{t.type}</td>
                    <td className="p-4 text-right font-mono">{t.usage}</td>
                    <td className="p-4 text-right font-mono text-red-600 font-bold">{t.calculatedEmissions}</td>
                    <td className="p-4 text-center"><span className="text-xs bg-sky-50 text-sky-700 border border-sky-300 font-bold px-3 py-0.5 rounded-full shadow-sm">⚙️ {t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ================= VIEW: ENVIRONMENTAL GOALS ================= */}
          {activeSubTab === 'Environmental Goals' && (
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Department</th>
                  <th className="p-4 text-right">Target CO₂</th>
                  <th className="p-4 text-right">Current CO₂</th>
                  <th className="p-4 w-48">Progress</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {INITIAL_GOALS.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map((goal) => {
                  const progressPercentage = Math.min(Math.round((goal.currentCo2 / goal.targetCo2) * 100), 100);
                  return (
                    <tr key={goal.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedRowId === goal.id ? 'bg-emerald-50/70' : ''}`} onClick={() => setSelectedRowId(goal.id === selectedRowId ? null : goal.id)}>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedRowId === goal.id} onChange={() => setSelectedRowId(goal.id === selectedRowId ? null : goal.id)} className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500" />
                      </td>
                      <td className="p-4 font-black text-slate-900">{goal.name}</td>
                      <td className="p-4 text-slate-800">{goal.department}</td>
                      <td className="p-4 text-right font-mono text-slate-900">{goal.targetCo2} t</td>
                      <td className="p-4 text-right font-mono text-emerald-700">{goal.currentCo2} t</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-slate-200 rounded-full h-2.5 border border-slate-300/60">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                          </div>
                          <span className="text-xs font-mono text-slate-700 font-bold">{progressPercentage}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-mono">{goal.deadline}</td>
                      <td className="p-4 text-center">
                        <span className={`border px-3 py-1 rounded-full text-xs font-bold ${
                          goal.status === 'Active' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' :
                          goal.status === 'On Track' ? 'border-2 border-emerald-600 text-emerald-800 bg-emerald-100 shadow-sm' :
                          'border border-sky-500 text-sky-700 bg-sky-50'
                        }`}>{goal.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

        </div>

        {/* 4. COMPLIANCE AUTOMATED LEDGER FOOTER TRACE NOTE */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center text-xs text-slate-800 font-bold italic bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
          <span className="text-emerald-600 mr-2 font-black text-sm select-none">ℹ</span>
          <span>Carbon Transactions auto-generated from Purchase/Manufacturing/Fleet/Expenses</span>
        </div>

      </BentoGlowEffect>
    </div>
  );
}