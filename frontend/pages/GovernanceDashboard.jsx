import { useState } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- MOCK REGISTRY FOR POLICIES ---
const INITIAL_POLICIES = [
  { id: 1, title: "Global Whistleblower Protection Mandate", code: "POL-GOV-001", effectiveDate: "2026-01-10", version: "v4.2", riskTier: "Critical", status: "Active" },
  { id: 2, title: "Anti-Bribery and Corruption Framework", code: "POL-FIN-023", effectiveDate: "2026-02-18", version: "v3.0", riskTier: "High", status: "Active" },
  { id: 3, title: "Sustainable Supply Chain & Scope-3 Standards", code: "POL-ESG-088", effectiveDate: "2026-04-05", version: "v1.1", riskTier: "Medium", status: "Under Review" },
  { id: 4, title: "Data Privacy & Cross-Border Governance", code: "POL-IT-104", effectiveDate: "2025-11-12", version: "v5.0", riskTier: "Critical", status: "Active" },
];

// --- MOCK REGISTRY FOR POLICY ACKNOWLEDGEMENTS ---
const INITIAL_ACKNOWLEDGEMENTS = [
  { id: 501, employee: "Sarah Jenkins", department: "Logistics & Procurement", policyName: "Sustainable Supply Chain & Scope-3 Standards", completionDate: "2026-05-18", status: "Attested" },
  { id: 502, employee: "Michael Chang", department: "Engineering & R&D", policyName: "Anti-Bribery and Corruption Framework", completionDate: "2026-06-01", status: "Attested" },
  { id: 503, employee: "Elena Rostova", department: "Legal & Corporate Affairs", policyName: "Global Whistleblower Protection Mandate", completionDate: "—", status: "Overdue" },
  { id: 504, employee: "David Kojo", department: "Global Operations", policyName: "Data Privacy & Cross-Border Governance", completionDate: "2026-06-14", status: "Attested" },
];

// --- MOCK REGISTRY FOR AUDITS LOG DATA ---
const INITIAL_AUDITS = [
  { id: 301, title: "Q2 Supply Chain Carbon Audit", department: "Logistics & Procurement", auditor: "Deloitte ESG Practice", date: "2026-05-14", findings: "Minor scope-3 emission tracking gaps identified.", status: "Completed" },
  { id: 302, title: "Annual Data Privacy & Security Audit", department: "IT & Global Infrastructure", auditor: "Internal Audit Committee", date: "2026-06-02", findings: "Legacy data storage nodes require encryption updates.", status: "Under Review" },
  { id: 303, title: "EHS Workplace Safety Assessment", department: "Manufacturing Plant 4", auditor: "OSHA Certified Panel", date: "2026-06-28", findings: "Hazardous waste storage alignment protocols fully verified.", status: "Completed" },
  { id: 304, title: "Anti-Bribery & Corruption Review", department: "Legal & Corporate Affairs", auditor: "Compliance Group Intl.", date: "2026-07-10", findings: "Whistleblower reporting portal access points need modernization.", status: "Under Review" },
];

// --- MOCK REGISTRY FOR COMPLIANCE ISSUES SUB-TABLE (RULE-DRIVEN LOGIC) ---
const INITIAL_COMPLIANCE_ISSUES = [
  { id: 1, auditId: 301, issue: "Scope-3 Freight Supplier Log Mismatch", severity: "Medium", department: "Logistics & Procurement", owner: "Marcus Vance", dueDate: "2026-08-15", status: "Open" },
  { id: 2, auditId: 302, issue: "Unencrypted PII Legacy Database Node", severity: "High", department: "IT & Global Infrastructure", owner: "Diana Prince", dueDate: "2026-07-30", status: "Open" },
  { id: 3, auditId: 302, issue: "Stale Access Credentials for Contractors", severity: "Medium", department: "IT & Global Infrastructure", owner: "Diana Prince", dueDate: "2026-08-22", status: "Resolved" },
  { id: 4, auditId: 304, issue: "Whistleblower Portal SSL Protocol Expiry", severity: "High", department: "Legal & Corporate Affairs", owner: "Elena Rostova", dueDate: "2026-07-25", status: "Open" },
];

export default function GovernanceDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('Audits');
  const [policies] = useState(INITIAL_POLICIES);
  const [acknowledgements] = useState(INITIAL_ACKNOWLEDGEMENTS);
  const [audits] = useState(INITIAL_AUDITS);
  const [issues] = useState(INITIAL_COMPLIANCE_ISSUES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);

  const govPlum = "#A10559";

  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSearchTerm('');
    setSelectedRowId(null);
  };

  const filteredIssues = selectedRowId 
    ? issues.filter(issue => issue.auditId === selectedRowId)
    : issues;

  return (
    <div className="p-6 min-h-screen bg-slate-50 text-slate-900">
      
      {/* 1. TOP SUB-NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-300 mb-6 pb-2 overflow-x-auto">
        {['Policies', 'Policy Acknowledgements', 'Audits', 'Compliance Issues'].map((tab) => (
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

      {/* 2. DYNAMIC WORKSPACE UTILITY ACTION ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center flex-wrap gap-2">
          <button 
            onClick={() => alert(`Launching: + New Governance ${activeSubTab.replace('s', '')}`)}
            className="text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: govPlum }}
          >
            + New {activeSubTab === 'Audits' ? 'Audit' : activeSubTab === 'Compliance Issues' ? 'Violation Flag' : activeSubTab === 'Policy Acknowledgements' ? 'Log Ledger' : 'Policy'}
          </button>
          
          <button 
            onClick={() => alert(`Compiling export array manifest for systemic ${activeSubTab} logs...`)}
            className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded font-bold text-sm border border-slate-300 transition-all shadow-sm"
          >
            Export Controls ▾
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
                  <th className="p-4">Policy Code</th>
                  <th className="p-4">Corporate Strategy Title</th>
                  <th className="p-4 text-center">Version Revision</th>
                  <th className="p-4 text-center">Effective Date</th>
                  <th className="p-4 text-center">Risk Vector Tier</th>
                  <th className="p-4 text-center">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {policies.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    style={selectedRowId === row.id ? { backgroundColor: 'rgba(161, 5, 89, 0.06)' } : {}}
                    onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)} className="rounded border-slate-400" style={{ color: govPlum }} />
                    </td>
                    <td className="p-4 font-mono text-xs font-black text-slate-900">{row.code}</td>
                    <td className="p-4 text-slate-900 text-sm font-black">{row.title}</td>
                    <td className="p-4 text-center font-mono text-xs text-slate-600">{row.version}</td>
                    <td className="p-4 text-center font-mono text-xs text-slate-600">{row.effectiveDate}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase border ${
                        row.riskTier === 'Critical' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {row.riskTier}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        row.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-purple-50 text-purple-700 border-purple-300 animate-pulse'
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

      {/* ================= VIEW 2: POLICY ACKNOWLEDGEMENTS ================= */}
      {activeSubTab === 'Policy Acknowledgements' && (
        <BentoGlowEffect glowColor="161, 5, 89" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Employee Contributor</th>
                  <th className="p-4">Operational Division Domain</th>
                  <th className="p-4">Associated Target Policy Document Scope</th>
                  <th className="p-4 text-center">Attestation Signed Date</th>
                  <th className="p-4 text-center">Audit Status Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {acknowledgements.filter(a => a.employee.toLowerCase().includes(searchTerm.toLowerCase()) || a.policyName.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    style={selectedRowId === row.id ? { backgroundColor: 'rgba(161, 5, 89, 0.06)' } : {}}
                    onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)} className="rounded border-slate-400" style={{ color: govPlum }} />
                    </td>
                    <td className="p-4 font-black text-slate-900">{row.employee}</td>
                    <td className="p-4 text-slate-700 text-xs font-bold">{row.department}</td>
                    <td className="p-4 text-slate-800 text-sm">{row.policyName}</td>
                    <td className="p-4 text-center font-mono text-xs text-slate-600">{row.completionDate}</td>
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
                    <th className="p-4 text-center">Closing Date</th>
                    <th className="p-4">Primary Target Findings</th>
                    <th className="p-4 text-center">Status Track</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-black font-semibold">
                  {audits.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      style={selectedRowId === row.id ? { backgroundColor: 'rgba(161, 5, 89, 0.06)' } : {}}
                      onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)} className="rounded border-slate-400" style={{ color: govPlum }} />
                      </td>
                      <td className="p-4 font-black text-slate-900">{row.title}</td>
                      <td className="p-4 text-slate-700 text-xs font-bold">{row.department}</td>
                      <td className="p-4 text-slate-800">{row.auditor}</td>
                      <td className="p-4 text-center font-mono text-xs text-slate-600">{row.date}</td>
                      <td className="p-4 text-slate-500 max-w-xs truncate text-xs font-medium">{row.findings}</td>
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
                  {selectedRowId ? `Displaying filtered violations isolated under Audit Assessment Node ID: ${selectedRowId}` : "Displaying entire operational active compliance violation pipeline."}
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
                      <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{issue.issue}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            issue.severity === 'High' ? 'bg-red-50 text-red-700 border-red-300 font-black' : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-bold">{issue.department}</td>
                        <td className="p-3 text-slate-900 font-mono font-bold">{issue.owner}</td>
                        <td className="p-3 text-center font-mono text-slate-600">{issue.dueDate}</td>
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
                {issues.filter(i => i.issue.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    style={selectedRowId === row.id ? { backgroundColor: 'rgba(161, 5, 89, 0.06)' } : {}}
                    onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)} className="rounded border-slate-400" style={{ color: govPlum }} />
                    </td>
                    <td className="p-4 font-black text-slate-900">{row.issue}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-black uppercase border ${row.severity === 'High' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 text-xs font-bold">{row.department}</td>
                    <td className="p-4 font-bold text-slate-900">{row.owner}</td>
                    <td className="p-4 text-center font-mono text-xs text-slate-600">{row.dueDate}</td>
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

    </div>
  );
}