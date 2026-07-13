import { useState, useEffect } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- BACKEND CONNECTION ---
import api from '../api';

const NEW_ENTRY_LABELS = {
  'Emission Factors': 'Emission Factor',
  'Product ESG Profiles': 'Product Profile',
  'Carbon Transactions': 'Transaction',
  'Environmental Goals': 'Goal',
};

// Carbon Transactions are an immutable hash-chained ledger by design (see
// backend's CarbonTransaction model) - no edit/delete endpoint exists for
// them on purpose. Everything else supports normal edit/soft-delete.
const READONLY_TABS = ['Carbon Transactions'];

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toISOString().slice(0, 10);
}

// Backend stores a numeric esgScore (0-100), not a letter rating - derived here.
function scoreToRating(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

/**
 * Gap Fix: the old Export button always called the backend's
 * /api/reports/export/csv?module=environmental endpoint no matter which
 * sub-tab you were viewing - that endpoint maps ONLY to CarbonTransaction
 * data (the custom report builder's "environmental module" concept), so
 * clicking Export while on "Product ESG Profiles" silently exported Carbon
 * Transactions instead. Emission Factors / Product ESG Profiles /
 * Environmental Goals are master data, not covered by that report system at
 * all - so those 3 tabs now export client-side, straight from whatever's
 * already loaded on screen. Only Carbon Transactions - which genuinely IS
 * the "environmental module" - uses the real backend export.
 */
function downloadClientCsv(filename, rows) {
  if (!rows || rows.length === 0) {
    alert('No data to export on this tab yet.');
    return;
  }
  const flatRows = rows.map((row) => {
    const flat = {};
    Object.entries(row).forEach(([key, val]) => {
      if (key === '__v') return;
      if (val && typeof val === 'object' && !(val instanceof Date)) {
        flat[key] = val.name || val._id || JSON.stringify(val);
      } else {
        flat[key] = val;
      }
    });
    return flat;
  });
  const headers = Object.keys(flatRows[0]);
  const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...flatRows.map((r) => headers.map((h) => escapeCsv(r[h])).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function EnvironmentalDashboard({ userRole }) {
  const isAdmin = userRole === 'admin';
  const [activeSubTab, setActiveSubTab] = useState('Environmental Goals');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);

  // --- BACKEND CONNECTION: real data instead of the mock arrays ---
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [productProfiles, setProductProfiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadAllData() {
    setLoading(true);
    setLoadError('');
    try {
      const [efRes, ppRes, ctRes, egRes, deptRes] = await Promise.allSettled([
        api.emissionFactors.list({ limit: 100 }),
        api.productEsgProfiles.list({ limit: 100 }),
        api.carbonTransactions.list({ limit: 100 }),
        api.environmentalGoals.list({ limit: 100 }),
        api.departments.list({ limit: 100 }),
      ]);

      // Gap Fix: this used to be Promise.all(), meaning if ANY ONE of these
      // 5 calls failed for any reason (a transient network blip, a stale
      // token, anything), the entire batch was thrown away - including
      // `departments`, which the New Goal / New Transaction forms depend on.
      // That's a very plausible explanation for a modal that opens but has
      // nothing usable in its dropdowns. Promise.allSettled means a single
      // failed source degrades gracefully instead of taking everything down.
      const failures = [];
      if (efRes.status === 'fulfilled') setEmissionFactors(efRes.value.data);
      else failures.push('emission factors');

      if (ppRes.status === 'fulfilled') setProductProfiles(ppRes.value.data);
      else failures.push('product ESG profiles');

      if (ctRes.status === 'fulfilled') setTransactions(ctRes.value.data);
      else failures.push('carbon transactions');

      if (egRes.status === 'fulfilled') setGoals(egRes.value.data);
      else failures.push('environmental goals');

      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data);
      else failures.push('departments');

      if (failures.length > 0) {
        console.error('Failed to load:', failures);
        setLoadError(`Failed to load: ${failures.join(', ')}. Try refreshing the page.`);
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load environmental data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);
  // --- END initial load ---

  // Clear tracking references whenever changing view scopes to avoid conflict cross-contamination
  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSearchTerm('');
    setSelectedRowId(null);
  };

  // --- BACKEND CONNECTION: create/edit modal handling ---
  function openCreateModal() {
    const defaults = {
      'Emission Factors': { name: '', activityType: '', unit: '', factorValue: '', source: '' },
      'Product ESG Profiles': { productName: '', sku: '', carbonFootprint: '', esgScore: '', notes: '' },
      'Carbon Transactions': { department: '', emissionFactor: '', source: 'Manual', quantity: '' },
      'Environmental Goals': { title: '', description: '', department: '', targetCO2: '', currentCO2: 0, deadline: '', status: 'Active' },
    };
    setFormData(defaults[activeSubTab] || {});
    setFormError('');
    setModalMode('create');
    setIsModalOpen(true);
  }

  function openEditModal() {
    if (!selectedRowId || READONLY_TABS.includes(activeSubTab)) return;

    if (activeSubTab === 'Emission Factors') {
      const ef = emissionFactors.find((x) => x._id === selectedRowId);
      setFormData({ name: ef.name, activityType: ef.activityType, unit: ef.unit, factorValue: ef.factorValue, source: ef.source || '' });
    } else if (activeSubTab === 'Product ESG Profiles') {
      const pp = productProfiles.find((x) => x._id === selectedRowId);
      setFormData({ productName: pp.productName, sku: pp.sku, carbonFootprint: pp.carbonFootprint, esgScore: pp.esgScore, notes: pp.notes || '' });
    } else if (activeSubTab === 'Environmental Goals') {
      const g = goals.find((x) => x._id === selectedRowId);
      setFormData({
        title: g.title,
        description: g.description || '',
        department: g.department?._id || g.department,
        targetCO2: g.targetCO2,
        currentCO2: g.currentCO2,
        deadline: formatDate(g.deadline),
        status: g.status,
      });
    }
    setFormError('');
    setModalMode('edit');
    setIsModalOpen(true);
  }

  // Explicit client-side validation BEFORE hitting the API - this makes any
  // "nothing happened when I clicked Save" scenario impossible: either the
  // form is genuinely valid and something real happens, or you get a visible,
  // persistent inline error explaining exactly what's missing.
  function validateForm() {
    if (activeSubTab === 'Emission Factors') {
      if (!formData.name || !formData.activityType || !formData.unit || formData.factorValue === '' || formData.factorValue === undefined) {
        return 'Name, Activity Type, Unit, and Factor Value are all required.';
      }
    } else if (activeSubTab === 'Product ESG Profiles') {
      if (!formData.productName || !formData.sku || formData.carbonFootprint === '' || formData.esgScore === '') {
        return 'Product Name, SKU, Carbon Footprint, and ESG Score are all required.';
      }
    } else if (activeSubTab === 'Carbon Transactions') {
      if (!formData.department || !formData.emissionFactor || !formData.quantity) {
        return 'Department, Emission Factor, and Quantity are all required.';
      }
      if (departments.length === 0) return 'No departments loaded yet - refresh the page and try again.';
      if (emissionFactors.length === 0) return 'No emission factors exist yet - create one on the Emission Factors tab first.';
    } else if (activeSubTab === 'Environmental Goals') {
      if (!formData.title || !formData.department || !formData.targetCO2 || !formData.deadline) {
        return 'Title, Department, Target CO2, and Deadline are all required.';
      }
      if (departments.length === 0) return 'No departments loaded yet - refresh the page and try again.';
    }
    return null;
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    try {
      if (activeSubTab === 'Emission Factors') {
        const body = { ...formData, factorValue: Number(formData.factorValue) };
        if (modalMode === 'create') await api.emissionFactors.create(body);
        else await api.emissionFactors.update(selectedRowId, body);
      } else if (activeSubTab === 'Product ESG Profiles') {
        const body = { ...formData, carbonFootprint: Number(formData.carbonFootprint), esgScore: Number(formData.esgScore) };
        if (modalMode === 'create') await api.productEsgProfiles.create(body);
        else await api.productEsgProfiles.update(selectedRowId, body);
      } else if (activeSubTab === 'Carbon Transactions') {
        // Create only - quantity/department/emissionFactor/source; backend
        // computes calculatedCO2e, anomaly flag, and hash-chain link itself.
        await api.carbonTransactions.create({ ...formData, quantity: Number(formData.quantity) });
      } else if (activeSubTab === 'Environmental Goals') {
        const body = { ...formData, targetCO2: Number(formData.targetCO2), currentCO2: Number(formData.currentCO2) };
        if (modalMode === 'create') await api.environmentalGoals.create(body);
        else await api.environmentalGoals.update(selectedRowId, body);
      }
      setIsModalOpen(false);
      setSelectedRowId(null);
      await loadAllData();
    } catch (err) {
      console.error('Save failed:', err);
      setFormError(err.message || 'Save failed - see console for details.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedRowId || READONLY_TABS.includes(activeSubTab)) return;
    if (!window.confirm('Soft-delete this record? (It can be restored later - nothing is permanently destroyed.)')) return;

    try {
      if (activeSubTab === 'Emission Factors') await api.emissionFactors.remove(selectedRowId);
      else if (activeSubTab === 'Product ESG Profiles') await api.productEsgProfiles.remove(selectedRowId);
      else if (activeSubTab === 'Environmental Goals') await api.environmentalGoals.remove(selectedRowId);
      setSelectedRowId(null);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  }

  async function handleReview(txId, decision) {
    try {
      await api.carbonTransactions.review(txId, decision);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Review action failed');
    }
  }
  // --- END create/edit/delete/review handling ---

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

      {/* --- BACKEND CONNECTION: load error banner --- */}
      {loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl px-6 py-4 mb-6">
          ⚠️ {loadError}
        </div>
      )}

      {/* 2. DYNAMIC BENTO CONTENT CANVAS WRAPPER */}
      <BentoGlowEffect glowColor="34, 197, 94" spotlightRadius={260} className="p-2">
        
        {/* ACTION ROW HEADER UTILITIES */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center flex-wrap gap-2">
            {/* Gap Fix: "+New" is admin-only for master data (Emission
                Factors/Product Profiles/Goals) but genuinely open to any
                authenticated user for Carbon Transactions - the backend's
                POST /carbon-transactions has no requireAdmin gate, matching
                a real ERP workflow where any employee can log a transaction
                for their department. */}
            {(isAdmin || activeSubTab === 'Carbon Transactions') && (
              <button 
                onClick={openCreateModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-all"
              >
                + New {NEW_ENTRY_LABELS[activeSubTab]}
              </button>
            )}
            {isAdmin && (
              <>
                <button 
                  disabled={!selectedRowId || READONLY_TABS.includes(activeSubTab)}
                  onClick={openEditModal}
                  title={READONLY_TABS.includes(activeSubTab) ? 'Carbon Transactions are an immutable ledger - use Confirm/Reject on flagged rows instead' : ''}
                  className={`px-4 py-2 rounded font-bold text-sm transition-all border ${
                    selectedRowId && !READONLY_TABS.includes(activeSubTab) ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  Edit
                </button>
                <button 
                  disabled={!selectedRowId || READONLY_TABS.includes(activeSubTab)}
                  onClick={handleDelete}
                  title={READONLY_TABS.includes(activeSubTab) ? 'Carbon Transactions cannot be deleted - immutable ledger' : ''}
                  className={`px-4 py-2 rounded font-bold text-sm transition-all border ${
                    selectedRowId && !READONLY_TABS.includes(activeSubTab) ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  Delete
                </button>
              </>
            )}
            <button 
              onClick={() => {
                if (activeSubTab === 'Emission Factors') downloadClientCsv('emission-factors.csv', emissionFactors);
                else if (activeSubTab === 'Product ESG Profiles') downloadClientCsv('product-esg-profiles.csv', productProfiles);
                else if (activeSubTab === 'Environmental Goals') downloadClientCsv('environmental-goals.csv', goals);
                else api.reports.exportCsv({ module: 'environmental' }).catch((err) => alert(err.message));
              }}
              className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded font-bold text-sm border border-slate-300 transition-all shadow-sm"
            >
              Export CSV
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

          {loading && (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">Loading {activeSubTab.toLowerCase()}...</div>
          )}

          {/* ================= VIEW: EMISSION FACTORS ================= */}
          {!loading && activeSubTab === 'Emission Factors' && (
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">GHG Source Category</th>
                  <th className="p-4">Activity Type</th>
                  <th className="p-4 text-right">Calculation Factor</th>
                  <th className="p-4">Metric Formula Unit</th>
                  <th className="p-4">Regulatory Source Authority</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {emissionFactors.filter(ef => ef.name.toLowerCase().includes(searchTerm.toLowerCase())).map((ef) => (
                  <tr key={ef._id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedRowId === ef._id ? 'bg-emerald-50/70' : ''}`} onClick={() => setSelectedRowId(ef._id === selectedRowId ? null : ef._id)}>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === ef._id} onChange={() => setSelectedRowId(ef._id === selectedRowId ? null : ef._id)} className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td className="p-4 font-black">{ef.name}</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 text-xs rounded">{ef.activityType}</span></td>
                    <td className="p-4 text-right font-mono text-emerald-700">{ef.factorValue}</td>
                    <td className="p-4 font-mono text-slate-600 text-xs">{ef.unit}</td>
                    <td className="p-4 text-slate-700">{ef.source || '—'}</td>
                    <td className="p-4 text-center"><span className="text-xs bg-green-50 text-green-700 border border-green-300 font-bold px-2 py-0.5 rounded-full">{ef.isActive === false ? 'Inactive' : 'Active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ================= VIEW: PRODUCT ESG PROFILES ================= */}
          {!loading && activeSubTab === 'Product ESG Profiles' && (
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Product SKU</th>
                  <th className="p-4">Eco-Profile Name</th>
                  <th className="p-4 text-right">Lifecycle Carbon Footprint</th>
                  <th className="p-4 text-right">ESG Score</th>
                  <th className="p-4 text-center">Eco-Rating Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {productProfiles.filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
                  <tr key={p._id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedRowId === p._id ? 'bg-emerald-50/70' : ''}`} onClick={() => setSelectedRowId(p._id === selectedRowId ? null : p._id)}>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === p._id} onChange={() => setSelectedRowId(p._id === selectedRowId ? null : p._id)} className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td className="p-4 font-mono text-slate-600 text-xs">{p.sku}</td>
                    <td className="p-4 font-black">{p.productName}</td>
                    <td className="p-4 text-right font-mono text-red-600">{p.carbonFootprint} kg CO₂e</td>
                    <td className="p-4 text-right font-mono text-slate-700">{p.esgScore}/100</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-black border ${p.esgScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>{scoreToRating(p.esgScore)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ================= VIEW: CARBON TRANSACTIONS ================= */}
          {!loading && activeSubTab === 'Carbon Transactions' && (
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4">Transaction Date</th>
                  <th className="p-4">Department / Source</th>
                  <th className="p-4">Emission Factor</th>
                  <th className="p-4 text-right">Quantity</th>
                  <th className="p-4 text-right">Calculated Emissions</th>
                  <th className="p-4 text-center">Ledger Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {transactions
                  .filter(t => (t.department?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || t.source.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-500 text-xs">{formatDate(t.timestamp)}</td>
                    <td className="p-4 font-bold text-slate-900">{t.department?.name || '—'} <span className="font-normal text-slate-500">· {t.source}</span></td>
                    <td className="p-4 text-slate-700">{t.emissionFactor?.name || '—'}</td>
                    <td className="p-4 text-right font-mono">{t.quantity} {t.emissionFactor?.unit || ''}</td>
                    <td className="p-4 text-right font-mono text-red-600 font-bold">{t.calculatedCO2e?.toFixed(2)} kg</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs border font-bold px-3 py-0.5 rounded-full shadow-sm ${
                        t.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        t.status === 'Flagged' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                        'bg-slate-50 text-slate-500 border-slate-300'
                      }`}>
                        {t.anomalyFlag ? '🚨 ' : '⚙️ '}{t.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {t.status === 'Flagged' && isAdmin ? (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleReview(t._id, 'Confirmed')} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-bold">Confirm</button>
                          <button onClick={() => handleReview(t._id, 'Rejected')} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-bold">Reject</button>
                        </div>
                      ) : t.status === 'Flagged' ? (
                        <span className="text-amber-600 text-xs font-bold">Pending admin review</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ================= VIEW: ENVIRONMENTAL GOALS ================= */}
          {!loading && activeSubTab === 'Environmental Goals' && (
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
                {goals.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase())).map((goal) => {
                  const progressPercentage = Math.min(Math.round((goal.currentCO2 / goal.targetCO2) * 100), 100);
                  return (
                    <tr key={goal._id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedRowId === goal._id ? 'bg-emerald-50/70' : ''}`} onClick={() => setSelectedRowId(goal._id === selectedRowId ? null : goal._id)}>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedRowId === goal._id} onChange={() => setSelectedRowId(goal._id === selectedRowId ? null : goal._id)} className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500" />
                      </td>
                      <td className="p-4 font-black text-slate-900">{goal.title}</td>
                      <td className="p-4 text-slate-800">{goal.department?.name || '—'}</td>
                      <td className="p-4 text-right font-mono text-slate-900">{goal.targetCO2} kg</td>
                      <td className="p-4 text-right font-mono text-emerald-700">{goal.currentCO2} kg</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-slate-200 rounded-full h-2.5 border border-slate-300/60">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                          </div>
                          <span className="text-xs font-mono text-slate-700 font-bold">{progressPercentage}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-mono">{formatDate(goal.deadline)}</td>
                      <td className="p-4 text-center">
                        <span className={`border px-3 py-1 rounded-full text-xs font-bold ${
                          goal.status === 'Active' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' :
                          goal.status === 'On Track' ? 'border-2 border-emerald-600 text-emerald-800 bg-emerald-100 shadow-sm' :
                          goal.status === 'At Risk' ? 'border border-red-500 text-red-700 bg-red-50' :
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
          <span>Carbon Transactions are cryptographically hash-chained and immutable once created</span>
        </div>

      </BentoGlowEffect>

      {/* --- BACKEND CONNECTION: create/edit modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {modalMode === 'create' ? 'New' : 'Edit'} {NEW_ENTRY_LABELS[activeSubTab]}
            </h3>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg px-3 py-2">
                ⚠️ {formError}
              </div>
            )}

            {activeSubTab === 'Emission Factors' && (
              <>
                <input required placeholder="Name (e.g. Grid Electricity)" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required placeholder="Activity Type (e.g. Electricity, Fleet)" value={formData.activityType || ''} onChange={(e) => setFormData({ ...formData, activityType: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required placeholder="Unit (e.g. kWh, litre)" value={formData.unit || ''} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="number" step="any" placeholder="Factor Value (kg CO2e per unit)" value={formData.factorValue} onChange={(e) => setFormData({ ...formData, factorValue: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input placeholder="Source (e.g. EPA 2026)" value={formData.source || ''} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </>
            )}

            {activeSubTab === 'Product ESG Profiles' && (
              <>
                <input required placeholder="Product Name" value={formData.productName || ''} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required placeholder="SKU" value={formData.sku || ''} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="number" step="any" placeholder="Carbon Footprint (kg CO2e)" value={formData.carbonFootprint} onChange={(e) => setFormData({ ...formData, carbonFootprint: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="number" min="0" max="100" placeholder="ESG Score (0-100)" value={formData.esgScore} onChange={(e) => setFormData({ ...formData, esgScore: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <textarea placeholder="Notes" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </>
            )}

            {activeSubTab === 'Carbon Transactions' && (
              <>
                <select required value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select department...</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <select required value={formData.emissionFactor || ''} onChange={(e) => setFormData({ ...formData, emissionFactor: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select emission factor...</option>
                  {emissionFactors.map((ef) => <option key={ef._id} value={ef._id}>{ef.name} ({ef.unit})</option>)}
                </select>
                <select required value={formData.source || 'Manual'} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  {['Purchase', 'Manufacturing', 'Expense', 'Fleet', 'Manual'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input required type="number" step="any" placeholder="Quantity" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <p className="text-xs text-slate-500">CO₂e is calculated automatically from quantity × the emission factor's value, and checked for anomalies before confirming.</p>
              </>
            )}

            {activeSubTab === 'Environmental Goals' && (
              <>
                <input required placeholder="Goal Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select required value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select department...</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <input required type="number" step="any" placeholder="Target CO2 (kg)" value={formData.targetCO2} onChange={(e) => setFormData({ ...formData, targetCO2: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input type="number" step="any" placeholder="Current CO2 (kg)" value={formData.currentCO2} onChange={(e) => setFormData({ ...formData, currentCO2: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <p className="text-xs text-slate-500">Note: currentCO2 also auto-increments as new Confirmed Carbon Transactions come in for this department - manual edits may be overtaken by that.</p>
                <input required type="date" value={formData.deadline || ''} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select value={formData.status || 'Active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  {['Active', 'On Track', 'At Risk', 'Completed'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded font-bold text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}