import { useState, useEffect } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- BACKEND CONNECTION ---
import api from '../api';

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toISOString().slice(0, 10);
}

// Audits are fully admin-only on the backend (even GET), matching the spec's
// wording precisely: employees "will only be able to view [compliance
// issues], not create or delete audits" - audits themselves aren't in an
// employee's view at all, only issues are.
const EMPLOYEE_TABS = ['Policies', 'Policy Acknowledgements', 'Compliance Issues'];
const ADMIN_TABS = ['Policies', 'Policy Acknowledgements', 'Audits', 'Compliance Issues'];

export default function GovernanceDashboard({ userRole }) {
  const isAdmin = userRole === 'admin';
  const [activeSubTab, setActiveSubTab] = useState(isAdmin ? 'Audits' : 'Policies');

  // --- BACKEND CONNECTION: real data ---
  const [policies, setPolicies] = useState([]);
  const [acknowledgements, setAcknowledgements] = useState([]); // combined Attested + derived Overdue rows
  const [audits, setAudits] = useState([]);
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]); // admin-only, may stay empty for non-admins
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const govPlum = '#A10559';

  async function loadAllData() {
    setLoading(true);
    setLoadError('');
    try {
      const [policiesRes, auditsRes, issuesRes, deptRes] = await Promise.allSettled([
        api.policies.list({ limit: 100 }),
        // Audits is fully admin-only (even GET) - don't even attempt it for
        // employees, since a "failure" here would just produce a needless
        // error banner for a tab they can't see anyway.
        isAdmin ? api.governance.listAudits({ limit: 100 }) : Promise.resolve({ data: [] }),
        api.governance.listComplianceIssues({ limit: 100 }),
        api.departments.list({ limit: 100 }),
      ]);

      // Gap Fix: was Promise.all() - a single failed call used to wipe out
      // ALL 4 results. allSettled means one failed source degrades
      // gracefully instead of blanking the whole page.
      const failures = [];
      let policiesData = [];
      if (policiesRes.status === 'fulfilled') {
        policiesData = policiesRes.value.data;
        setPolicies(policiesData);
      } else failures.push('policies');

      if (auditsRes.status === 'fulfilled') setAudits(auditsRes.value.data);
      else if (isAdmin) failures.push('audits');

      if (issuesRes.status === 'fulfilled') setIssues(issuesRes.value.data);
      else failures.push('compliance issues');

      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data);
      else failures.push('departments');

      if (failures.length > 0) {
        console.error('Failed to load:', failures);
        setLoadError(`Failed to load: ${failures.join(', ')}. Try refreshing the page.`);
      }

      // Acknowledgements + employee roster: admin-only data. No single
      // "list every acknowledgement" endpoint exists on the backend, so we
      // call the per-policy endpoint once per policy and combine client-side.
      // Gap Fix: this used to await each policy's acknowledgements
      // SEQUENTIALLY in a for-loop (slow, and one failure aborted the rest).
      // Now fetched in parallel via allSettled, so a single policy's
      // acknowledgement fetch failing doesn't lose the others.
      try {
        const { data: allEmployees } = await api.employees.list({ limit: 100 });
        setEmployees(allEmployees);
        const employeesById = Object.fromEntries(allEmployees.map((e) => [e._id, e]));

        const ackResults = await Promise.allSettled(
          policiesData.map((policy) => api.governance.listAcknowledgements(policy._id))
        );

        const ackRows = [];
        policiesData.forEach((policy, idx) => {
          const result = ackResults[idx];
          if (result.status !== 'fulfilled') return; // skip this one policy, keep the rest

          const acks = result.value;
          const ackedIds = new Set(acks.map((a) => a.employee._id));

          acks.forEach((a) => {
            const emp = employeesById[a.employee._id];
            ackRows.push({
              id: a._id,
              employee: a.employee.name,
              department: emp?.department?.name || '—',
              policyName: policy.title,
              completionDate: a.acknowledgedAt,
              status: 'Attested',
            });
          });

          if (policy.mandatoryAcknowledgement) {
            allEmployees
              .filter((e) => !ackedIds.has(e._id))
              .forEach((e) => {
                ackRows.push({
                  id: `${policy._id}-${e._id}`,
                  employee: e.name,
                  department: e.department?.name || '—',
                  policyName: policy.title,
                  completionDate: null,
                  status: 'Overdue',
                });
              });
          }
        });
        setAcknowledgements(ackRows);
      } catch {
        setEmployees([]);
        setAcknowledgements([]);
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSearchTerm('');
    setSelectedRowId(null);
  };

  const filteredIssues = selectedRowId 
    ? issues.filter(issue => issue.audit === selectedRowId || issue.audit?._id === selectedRowId)
    : issues;

  // --- BACKEND CONNECTION: "New X" create modals ---
  function openCreateModal() {
    const defaults = {
      Policies: { title: '', description: '', category: 'Governance', version: '1.0', mandatoryAcknowledgement: true },
      'Policy Acknowledgements': { policy: '' }, // "acknowledge as myself" flow, not admin-create-on-behalf-of
      Audits: { title: '', department: '', auditor: '', date: '', findings: '', status: 'Under Review' },
      'Compliance Issues': { audit: '', department: '', severity: 'Medium', description: '', owner: '', dueDate: '' },
    };
    setFormData(defaults[activeSubTab] || {});
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeSubTab === 'Policies') {
        await api.policies.create(formData);
      } else if (activeSubTab === 'Policy Acknowledgements') {
        await api.governance.acknowledgePolicy(formData.policy);
      } else if (activeSubTab === 'Audits') {
        await api.governance.createAudit(formData);
      } else if (activeSubTab === 'Compliance Issues') {
        const body = { ...formData };
        if (!body.audit) delete body.audit; // optional field
        await api.governance.createComplianceIssue(body);
      }
      setIsModalOpen(false);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }
  // --- END create modal handling ---

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-bold text-sm">Loading governance data...</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-slate-50 text-slate-900">
      
      {/* 1. TOP SUB-NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-300 mb-6 pb-2 overflow-x-auto">
        {(isAdmin ? ADMIN_TABS : EMPLOYEE_TABS).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === tab 
                ? 'text-white shadow-sm font-black' 
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 border-b-0'
            }`}
            style={activeSubTab === tab ? { backgroundColor: govPlum } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl px-6 py-4 mb-6">
          ⚠️ {loadError}
        </div>
      )}

      {/* 2. DYNAMIC WORKSPACE UTILITY ACTION ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center flex-wrap gap-2">
          {(isAdmin || activeSubTab === 'Policy Acknowledgements') && (
            <button 
              onClick={openCreateModal}
              className="text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: govPlum }}
            >
              + {activeSubTab === 'Audits' ? 'New Audit' : activeSubTab === 'Compliance Issues' ? 'New Violation Flag' : activeSubTab === 'Policy Acknowledgements' ? 'Acknowledge a Policy' : 'New Policy'}
            </button>
          )}
          
          <button 
            onClick={() => api.reports.exportCsv({ module: 'governance' }).catch((err) => alert(err.message))}
            className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded font-bold text-sm border border-slate-300 transition-all shadow-sm"
          >
            Export Controls
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder={`Filter through ${activeSubTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 text-sm w-64 focus:outline-none transition-all placeholder-slate-400 font-medium"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>
      </div>

      {/* 3. CORE SUB-TAB VIEW RUNTIME WORKSPACES */}
      
      {/* ================= VIEW 1: POLICIES ================= */}
      {activeSubTab === 'Policies' && (
        <BentoGlowEffect glowColor="161, 5, 89" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Corporate Strategy Title</th>
                  <th className="p-4 text-center">Category</th>
                  <th className="p-4 text-center">Version</th>
                  <th className="p-4 text-center">Created</th>
                  <th className="p-4 text-center">Mandatory</th>
                  <th className="p-4 text-center">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {policies.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr 
                    key={row._id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    style={selectedRowId === row._id ? { backgroundColor: 'rgba(161, 5, 89, 0.06)' } : {}}
                    onClick={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === row._id} onChange={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)} className="rounded border-slate-400" style={{ color: govPlum }} />
                    </td>
                    <td className="p-4 text-slate-900 text-sm font-black">{row.title}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase border bg-slate-100 text-slate-700 border-slate-300">{row.category}</span>
                    </td>
                    <td className="p-4 text-center font-mono text-xs text-slate-600">v{row.version}</td>
                    <td className="p-4 text-center font-mono text-xs text-slate-600">{formatDate(row.createdAt)}</td>
                    <td className="p-4 text-center font-mono text-xs">{row.mandatoryAcknowledgement ? '✅' : '—'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        row.isActive !== false ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}>
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

      {/* ================= VIEW 2: POLICY ACKNOWLEDGEMENTS ================= */}
      {activeSubTab === 'Policy Acknowledgements' && (
        <BentoGlowEffect glowColor="161, 5, 89" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            {employees.length === 0 && !isAdmin && (
              <p className="text-xs text-slate-600 bg-slate-50 border-b border-slate-200 p-3 font-semibold">
                ℹ️ This table (who's Attested/Overdue org-wide) needs admin access to compute. You can still acknowledge policies yourself using the "+ Acknowledge a Policy" button above.
              </p>
            )}
            {employees.length === 0 && isAdmin && (
              <p className="text-xs text-amber-700 bg-amber-50 border-b border-amber-200 p-3 font-semibold">⚠️ This view requires admin access to compute Overdue rows.</p>
            )}
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4">Employee Contributor</th>
                  <th className="p-4">Operational Division Domain</th>
                  <th className="p-4">Associated Target Policy Document Scope</th>
                  <th className="p-4 text-center">Attestation Signed Date</th>
                  <th className="p-4 text-center">Audit Status Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {acknowledgements
                  .filter(a => a.employee.toLowerCase().includes(searchTerm.toLowerCase()) || a.policyName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-900">{row.employee}</td>
                    <td className="p-4 text-slate-700 text-xs font-bold">{row.department}</td>
                    <td className="p-4 text-slate-800 text-sm">{row.policyName}</td>
                    <td className="p-4 text-center font-mono text-xs text-slate-600">{formatDate(row.completionDate)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        row.status === 'Attested' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-600 border-red-300 animate-pulse'
                      }`}>
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

      {/* ================= VIEW 3: AUDITS & DESTRUCTURING MAPPED SUB-TABLES ================= */}
      {activeSubTab === 'Audits' && (
        <div className="space-y-8">
          <BentoGlowEffect glowColor="161, 5, 89" spotlightRadius={280} className="p-1">
            <div className="flex justify-between items-center mb-3 px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Corporate ESG Audits Log Ledger
              </h3>
              {selectedRowId && (
                <button onClick={() => setSelectedRowId(null)} className="text-xs font-bold underline hover:text-slate-900" style={{ color: govPlum }}>
                  Clear Row Selection Focus
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
                <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-4 w-8"></th>
                    <th className="p-4">Audit Assessment Title</th>
                    <th className="p-4">Operating Department</th>
                    <th className="p-4">Assigned Auditor Agency</th>
                    <th className="p-4 text-center">Date</th>
                    <th className="p-4">Primary Target Findings</th>
                    <th className="p-4 text-center">Status Track</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-black font-semibold">
                  {audits.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                    <tr 
                      key={row._id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      style={selectedRowId === row._id ? { backgroundColor: 'rgba(161, 5, 89, 0.06)' } : {}}
                      onClick={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedRowId === row._id} onChange={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)} className="rounded border-slate-400" style={{ color: govPlum }} />
                      </td>
                      <td className="p-4 font-black text-slate-900">{row.title}</td>
                      <td className="p-4 text-slate-700 text-xs font-bold">{row.department?.name || '—'}</td>
                      <td className="p-4 text-slate-800">{row.auditor}</td>
                      <td className="p-4 text-center font-mono text-xs text-slate-600">{formatDate(row.date)}</td>
                      <td className="p-4 text-slate-500 max-w-xs truncate text-xs font-medium">{row.findings || '—'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black border tracking-wide ${
                          row.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-purple-50 text-purple-700 border-purple-300 animate-pulse'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoGlowEffect>

          {/* DYNAMIC COMPLIANCE ISSUES SUB-TABLE DISPLAY */}
          <div className="border border-slate-300/80 rounded-2xl bg-slate-100 p-5 shadow-inner transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
              <div>
                <h4 className="font-black text-slate-950 tracking-tight text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                  Linked Compliance Issues Raised From Audit Index
                </h4>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  {selectedRowId ? `Displaying filtered violations isolated under the selected Audit` : "Displaying entire operational active compliance violation pipeline."}
                </p>
              </div>
              {selectedRowId && (
                <span className="text-[10px] font-black text-white px-2 py-0.5 rounded shadow-sm self-start sm:self-auto" style={{ backgroundColor: govPlum }}>
                  FILTER ACTIVE
                </span>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-300 text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="p-3">Tracked Issue Violation</th>
                    <th className="p-3 text-center">Severity Factor</th>
                    <th className="p-3">Department Domain</th>
                    <th className="p-3">Accountable Owner</th>
                    <th className="p-3 text-center">Resolution Target Due Date</th>
                    <th className="p-3 text-center">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-black font-semibold">
                  {filteredIssues.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 font-bold">
                        No active compliance issue metrics filed under these target parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredIssues.map((issue) => (
                      <tr key={issue._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{issue.description}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            issue.severity === 'High' ? 'bg-red-50 text-red-700 border-red-300 font-black' : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-bold">{issue.department?.name || '—'}</td>
                        <td className="p-3 text-slate-900 font-mono font-bold">{issue.owner?.name || '—'}</td>
                        <td className="p-3 text-center font-mono text-slate-600">{formatDate(issue.dueDate)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${
                            issue.status === 'Open' ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-green-50 text-green-700 border-green-300'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: COMPLIANCE ISSUES MAIN ENGINE ================= */}
      {activeSubTab === 'Compliance Issues' && (
        <BentoGlowEffect glowColor="161, 5, 89" spotlightRadius={280} className="p-1">
          {!isAdmin && (
            <p className="text-xs text-slate-500 font-semibold mb-3 px-1">
              Showing compliance issues where you're the assigned owner. You can view these but can't create, edit, or delete them - only an Admin can.
            </p>
          )}
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Identified Systemic Risk Issue</th>
                  <th className="p-4 text-center">Risk Tier Box</th>
                  <th className="p-4">Impact Department</th>
                  <th className="p-4">Assigned Remediation Owner</th>
                  <th className="p-4 text-center">Target Remediation Due Date</th>
                  <th className="p-4 text-center">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {issues.filter(i => i.description.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr 
                    key={row._id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    style={selectedRowId === row._id ? { backgroundColor: 'rgba(161, 5, 89, 0.06)' } : {}}
                    onClick={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === row._id} onChange={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)} className="rounded border-slate-400" style={{ color: govPlum }} />
                    </td>
                    <td className="p-4 font-black text-slate-900">{row.description}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-black uppercase border ${row.severity === 'High' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 text-xs font-bold">{row.department?.name || '—'}</td>
                    <td className="p-4 font-bold text-slate-900">{row.owner?.name || '—'}</td>
                    <td className="p-4 text-center font-mono text-xs text-slate-600">{formatDate(row.dueDate)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${row.status === 'Open' ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-green-50 text-green-700 border-green-300'}`}>
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

      {/* 4. GOVERNANCE REPORTING FOOTER */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center text-xs text-slate-800 font-bold italic bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
        <span className="mr-2 font-black text-sm select-none" style={{ color: govPlum }}>🔒</span>
        <span>Governance record matrices are immutable snapshots locked via verified tracking framework ledgers.</span>
      </div>

      {/* --- BACKEND CONNECTION: create modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {activeSubTab === 'Policy Acknowledgements' ? 'Acknowledge a Policy' : `New ${activeSubTab === 'Audits' ? 'Audit' : activeSubTab === 'Compliance Issues' ? 'Violation Flag' : 'Policy'}`}
            </h3>

            {activeSubTab === 'Policies' && (
              <>
                <input required placeholder="Policy Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <textarea required placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  {['Environmental', 'Social', 'Governance'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Version (e.g. 1.0)" value={formData.version || ''} onChange={(e) => setFormData({ ...formData, version: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={formData.mandatoryAcknowledgement} onChange={(e) => setFormData({ ...formData, mandatoryAcknowledgement: e.target.checked })} />
                  Mandatory acknowledgement
                </label>
              </>
            )}

            {activeSubTab === 'Policy Acknowledgements' && (
              <>
                <select required value={formData.policy || ''} onChange={(e) => setFormData({ ...formData, policy: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select a policy to acknowledge...</option>
                  {policies.map((p) => <option key={p._id} value={p._id}>{p.title} (v{p.version})</option>)}
                </select>
                <p className="text-xs text-slate-500">This acknowledges the policy as the currently logged-in account - there's no admin action to acknowledge on someone else's behalf.</p>
              </>
            )}

            {activeSubTab === 'Audits' && (
              <>
                <input required placeholder="Audit Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select required value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select department...</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <input required placeholder="Auditor" value={formData.auditor || ''} onChange={(e) => setFormData({ ...formData, auditor: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <textarea placeholder="Findings" value={formData.findings || ''} onChange={(e) => setFormData({ ...formData, findings: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  {['Under Review', 'Completed'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}

            {activeSubTab === 'Compliance Issues' && (
              <>
                <select value={formData.audit || ''} onChange={(e) => setFormData({ ...formData, audit: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Link to an audit (optional)...</option>
                  {audits.map((a) => <option key={a._id} value={a._id}>{a.title}</option>)}
                </select>
                <select required value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select department...</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  {['Low', 'Medium', 'High'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea required placeholder="Issue Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select required value={formData.owner || ''} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Assign owner...</option>
                  {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
                <input required type="date" value={formData.dueDate || ''} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                {employees.length === 0 && <p className="text-xs text-amber-700">⚠️ Owner list requires admin access to load.</p>}
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded font-bold text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded font-bold text-sm text-white disabled:opacity-50" style={{ backgroundColor: govPlum }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}