import { useState, useEffect } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- BACKEND CONNECTION ---
import api from '../api';

// Only these two tabs correspond to real list/table data on the backend.
// "ESG Configuration" and "Notification Settings" are backed by the single
// Settings document instead - see those view blocks below.
const CRUD_TABS = ['Departments', 'Categories'];

export default function SettingsDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('Departments');
  const [selectedRowId, setSelectedRowId] = useState(null);

  // --- BACKEND CONNECTION: real data ---
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [weightingForm, setWeightingForm] = useState({ environmental: 40, social: 30, governance: 30 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const graphitePrimary = '#334155';
  const graphiteAccent = '#475569';

  async function loadAllData() {
    setLoading(true);
    setLoadError('');
    try {
      const [deptRes, catRes, settingsRes] = await Promise.all([
        api.departments.list({ limit: 100 }),
        api.categories.list({ limit: 100 }),
        api.settings.get(),
      ]);
      setDepartments(deptRes.data);
      setCategories(catRes.data);
      setSettings(settingsRes);
      setWeightingForm({
        environmental: Math.round(settingsRes.esgWeighting.environmental * 100),
        social: Math.round(settingsRes.esgWeighting.social * 100),
        governance: Math.round(settingsRes.esgWeighting.governance * 100),
      });
    } catch (err) {
      setLoadError(err.message || 'Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSelectedRowId(null);
  };

  function getDepartmentName(id) {
    if (!id) return '—';
    const dept = departments.find((d) => d._id === id);
    return dept?.name || '—';
  }

  // --- BACKEND CONNECTION: Settings toggles (shared by bottom section + Notification tab) ---
  async function handleToggle(fieldName) {
    try {
      const updated = await api.settings.update({ [fieldName]: !settings[fieldName] });
      setSettings(updated);
    } catch (err) {
      alert(err.message || 'Failed to update setting');
    }
  }

  async function handleSaveWeighting() {
    const sum = weightingForm.environmental + weightingForm.social + weightingForm.governance;
    if (sum !== 100) {
      alert(`Weights must sum to exactly 100% (currently ${sum}%)`);
      return;
    }
    try {
      const updated = await api.settings.update({
        esgWeighting: {
          environmental: weightingForm.environmental / 100,
          social: weightingForm.social / 100,
          governance: weightingForm.governance / 100,
        },
      });
      setSettings(updated);
      alert('✅ ESG weighting updated.');
    } catch (err) {
      alert(err.message || 'Failed to update weighting');
    }
  }

  // --- BACKEND CONNECTION: Departments / Categories CRUD ---
  function openCreateModal() {
    if (activeSubTab === 'Departments') setFormData({ name: '', code: '', head: '', parentDepartment: '' });
    else if (activeSubTab === 'Categories') setFormData({ name: '', type: 'CSR Activity' });
    setModalMode('create');
    setIsModalOpen(true);
  }

  function openEditModal() {
    if (!selectedRowId) {
      alert(`Please select a row in the ${activeSubTab} table first.`);
      return;
    }
    if (activeSubTab === 'Departments') {
      const d = departments.find((x) => x._id === selectedRowId);
      setFormData({ name: d.name, code: d.code, head: d.head || '', parentDepartment: d.parentDepartment || '' });
    } else if (activeSubTab === 'Categories') {
      const c = categories.find((x) => x._id === selectedRowId);
      setFormData({ name: c.name, type: c.type });
    }
    setModalMode('edit');
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeSubTab === 'Departments') {
        const body = { ...formData };
        if (!body.parentDepartment) delete body.parentDepartment;
        if (modalMode === 'create') await api.departments.create(body);
        else await api.departments.update(selectedRowId, body);
      } else if (activeSubTab === 'Categories') {
        if (modalMode === 'create') await api.categories.create(formData);
        else await api.categories.update(selectedRowId, formData);
      }
      setIsModalOpen(false);
      setSelectedRowId(null);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedRowId) {
      alert(`Please select a row in the ${activeSubTab} table first.`);
      return;
    }
    if (!window.confirm('Soft-delete this record? (Nothing is permanently destroyed - can be restored later.)')) return;
    try {
      if (activeSubTab === 'Departments') await api.departments.remove(selectedRowId);
      else if (activeSubTab === 'Categories') await api.categories.remove(selectedRowId);
      setSelectedRowId(null);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-bold text-sm">Loading configuration...</div>;
  }

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

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl px-6 py-4">
          ⚠️ {loadError}
        </div>
      )}

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

      {/* 2. ROW-LEVEL MATRIX UNIVERSAL CONTROL BAR - only meaningful for the two real CRUD tabs */}
      {CRUD_TABS.includes(activeSubTab) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <button 
              onClick={openCreateModal}
              className="text-white px-4 py-2 rounded-xl font-black text-xs shadow-sm transition-all uppercase hover:opacity-90"
              style={{ backgroundColor: graphitePrimary }}
            >
              + New {activeSubTab.slice(0, -1)}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={openEditModal}
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 px-4 py-2 rounded-xl font-black text-xs transition-colors uppercase"
            >
              ✏️ Edit Selected
            </button>
            <button 
              onClick={handleDelete}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-4 py-2 rounded-xl font-black text-xs transition-colors uppercase"
            >
              🗑️ Delete Record
            </button>
          </div>
        </div>
      )}

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
                    key={row._id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    style={selectedRowId === row._id ? { backgroundColor: 'rgba(51, 65, 85, 0.05)' } : {}}
                    onClick={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRowId === row._id} 
                        onChange={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                        className="rounded border-slate-400 focus:ring-slate-500"
                      />
                    </td>
                    <td className="p-4 font-black text-slate-950">{row.name}</td>
                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{row.code}</td>
                    <td className="p-4 text-slate-800">{row.head || '—'}</td>
                    <td className="p-4 text-slate-400 text-xs font-bold">{getDepartmentName(row.parentDepartment)}</td>
                    <td className="p-4 text-center font-mono font-black text-slate-900">{row.employeeCount} employees</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${row.isActive !== false ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                        {row.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-slate-400 font-semibold p-3 border-t border-slate-200">Active Headcount is computed automatically from real employee records - not directly editable.</p>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 2: CATEGORIES MATRIX ================= */}
      {/* NOTE: the real Category model only covers CSR Activity / Challenge
          categorization - it has no pillar, weighting, or review-date concept.
          Those columns were dropped rather than fabricated. */}
      {activeSubTab === 'Categories' && (
        <BentoGlowEffect glowColor="51, 65, 85" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4">Category Name</th>
                  <th className="p-4 text-center">Used For</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {categories.map((row) => (
                  <tr 
                    key={row._id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    style={selectedRowId === row._id ? { backgroundColor: 'rgba(51, 65, 85, 0.05)' } : {}}
                    onClick={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRowId === row._id} 
                        onChange={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                        className="rounded border-slate-400 focus:ring-slate-500"
                      />
                    </td>
                    <td className="p-4 font-black text-slate-950">{row.name}</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        row.type === 'CSR Activity' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${row.isActive !== false ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                        {row.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 3: ESG CONFIGURATION (real Settings.esgWeighting) ================= */}
      {/* Replaced the fabricated "compliance framework registry" (GRI/SASB/BRSR -
          no backend equivalent) with the real, editable ESG weighting that
          the spec calls "configurable per organization". */}
      {activeSubTab === 'ESG Configuration' && (
        <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-black text-slate-950 tracking-tight">⚖️ Overall ESG Score Weighting</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Controls how Environmental, Social, and Governance department scores are blended into the Overall ESG Score. Must sum to 100%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['environmental', 'social', 'governance'].map((key) => (
              <div key={key} className="bg-slate-50 rounded-xl border border-slate-200/60 p-4">
                <label className="text-xs font-black text-slate-950 tracking-tight block mb-2 capitalize">{key}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={weightingForm[key]}
                    onChange={(e) => setWeightingForm({ ...weightingForm, [key]: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold"
                  />
                  <span className="text-slate-500 font-black">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className={`text-xs font-black ${weightingForm.environmental + weightingForm.social + weightingForm.governance === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {weightingForm.environmental + weightingForm.social + weightingForm.governance}%
            </span>
            <button onClick={handleSaveWeighting} className="text-white px-5 py-2 rounded-xl font-black text-sm shadow-sm" style={{ backgroundColor: graphitePrimary }}>
              Save Weighting
            </button>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: NOTIFICATION SETTINGS (real Settings toggles) ================= */}
      {/* Replaced the fabricated "notification rules registry" (fake dispatch
          methods/IDs - no backend equivalent) with the 4 real boolean
          toggles that actually exist on the Settings model. */}
      {activeSubTab === 'Notification Settings' && settings && (
        <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-950 tracking-tight">🔔 Notification Triggers</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">In-app (SSE) notifications only - there's no email channel implemented on the backend.</p>
          </div>

          {[
            { key: 'notifyOnComplianceIssue', label: 'New compliance issue raised', desc: 'Notifies the assigned owner the moment a compliance issue is created, and again if it becomes overdue.' },
            { key: 'notifyOnCSRChallengeApproval', label: 'CSR / Challenge approval decisions', desc: 'Notifies the employee when their CSR or Challenge submission is approved or rejected.' },
            { key: 'notifyOnPolicyAcknowledgementReminder', label: 'Policy acknowledgement reminders', desc: 'Daily reminder to any employee who hasn\'t acknowledged a mandatory policy.' },
            { key: 'notifyOnBadgeUnlock', label: 'Badge unlocked', desc: 'Notifies an employee the instant they unlock a new badge.' },
          ].map((item) => (
            <div key={item.key} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all">
              <div className="space-y-0.5 max-w-[85%]">
                <label className="text-xs font-black text-slate-950 tracking-tight block">{item.label}</label>
                <span className="text-[11px] text-slate-500 font-medium block leading-tight">{item.desc}</span>
              </div>
              <button 
                onClick={() => handleToggle(item.key)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${settings[item.key] ? 'bg-slate-700' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${settings[item.key] ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. GLOBAL ESG SYSTEM CONFIGURATION SWITCHES (real Settings toggles) */}
      {settings && (
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
                  Lets an external ERP system (e.g. Odoo) auto-create Carbon Transactions via the webhook endpoint instead of manual entry.
                </span>
              </div>
              <button 
                onClick={() => handleToggle('autoEmissionCalculationEnabled')}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${settings.autoEmissionCalculationEnabled ? 'bg-slate-700' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${settings.autoEmissionCalculationEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* SWITCH 2: SOCIAL CSR VERIFICATION */}
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all">
              <div className="space-y-0.5 max-w-[85%]">
                <label className="text-xs font-black text-slate-950 tracking-tight block">Require evidence for all CSR activities</label>
                <span className="text-[11px] text-slate-500 font-medium block leading-tight">
                  Blocks CSR participation approval until a proof file has been uploaded.
                </span>
              </div>
              <button 
                onClick={() => handleToggle('evidenceRequirementEnabled')}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${settings.evidenceRequirementEnabled ? 'bg-slate-700' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${settings.evidenceRequirementEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* SWITCH 3: GAMIFICATION ENGINE HOOK */}
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all">
              <div className="space-y-0.5 max-w-[85%]">
                <label className="text-xs font-black text-slate-950 tracking-tight block">Auto-award badges on threshold met</label>
                <span className="text-[11px] text-slate-500 font-medium block leading-tight">
                  Automatically assigns a Badge the moment an employee's XP or completed-challenge count meets its unlock rule.
                </span>
              </div>
              <button 
                onClick={() => handleToggle('badgeAutoAwardEnabled')}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${settings.badgeAutoAwardEnabled ? 'bg-slate-700' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${settings.badgeAutoAwardEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SYSTEM METRICS / SECURE SIGNATURE COMPLIANCE CONSOLE FOOTER */}
      <div className="mt-auto pt-4 border-t border-slate-200 flex items-center text-xs text-slate-700 font-bold italic bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span className="mr-2 font-black text-sm select-none" style={{ color: graphiteAccent }}>🔒</span>
        <span>Administrative actions are structurally appended directly to system audit logs under secure hash protection.</span>
      </div>

      {/* --- BACKEND CONNECTION: create/edit modal (Departments/Categories) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-black text-slate-900">{modalMode === 'create' ? 'New' : 'Edit'} {activeSubTab.slice(0, -1)}</h3>

            {activeSubTab === 'Departments' && (
              <>
                <input required placeholder="Department Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required placeholder="Code (e.g. MFG)" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input placeholder="Head (name)" value={formData.head || ''} onChange={(e) => setFormData({ ...formData, head: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select value={formData.parentDepartment || ''} onChange={(e) => setFormData({ ...formData, parentDepartment: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">No parent department</option>
                  {departments.filter((d) => d._id !== selectedRowId).map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </>
            )}

            {activeSubTab === 'Categories' && (
              <>
                <input required placeholder="Category Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="CSR Activity">CSR Activity</option>
                  <option value="Challenge">Challenge</option>
                </select>
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded font-bold text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded font-bold text-sm text-white disabled:opacity-50" style={{ backgroundColor: graphitePrimary }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}