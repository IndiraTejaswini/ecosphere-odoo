import { useState } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- MOCK REGISTRY FOR CSR CAMPAIGNS (HORIZONTAL DECK) ---
const INITIAL_CSR_ACTIVITIES = [
  { id: 101, title: "Tree Plantation Drive", joinedCount: 42, evidenceRequired: true, joined: false },
  { id: 102, title: "Annual Blood Donation", joinedCount: 118, evidenceRequired: false, joined: true },
  { id: 103, title: "Beach Cleanup Initiative", joinedCount: 25, evidenceRequired: true, joined: false },
  { id: 104, title: "Corporate ESG Workshop", joinedCount: 67, evidenceRequired: false, joined: false },
];

// --- MOCK REGISTRY FOR EMPLOYEE PARTICIPATION APPROVAL QUEUE & LOGS ---
const INITIAL_PARTICIPATION_QUEUE = [
  { id: 1, employee: "Sarah Jenkins", activity: "Beach Cleanup Initiative", proofUrl: "cleanup_photo_sj.jpg", points: 150, status: "Pending" },
  { id: 2, employee: "Michael Chang", activity: "Tree Plantation Drive", proofUrl: "sapling_sap_mc.png", points: 100, status: "Pending" },
  { id: 3, employee: "Elena Rostova", activity: "Corporate ESG Workshop", proofUrl: "attendance_cert.pdf", points: 50, status: "Approved" },
  { id: 4, employee: "David Kojo", activity: "Annual Blood Donation", proofUrl: "donor_slip_dk.jpg", points: 200, status: "Pending" },
];

// --- MOCK DATA FOR THE DIVERSITY DASHBOARD METRICS ---
const INITIAL_DIVERSITY_METRICS = [
  { id: 1, metric: "Gender Diversity (Leadership)", department: "Executive Board", currentPct: 42, targetPct: 50, regionalBench: "38%", healthStatus: "On Track" },
  { id: 2, metric: "Underrepresented Groups", department: "Engineering & R&D", currentPct: 28, targetPct: 35, regionalBench: "22%", healthStatus: "Needs Attention" },
  { id: 3, metric: "Veterans & Alternative Paths", department: "Global Operations", currentPct: 12, targetPct: 10, regionalBench: "8%", healthStatus: "Target Met" },
  { id: 4, metric: "Internal Promotion Parity", department: "All Departments", currentPct: 89, targetPct: 90, regionalBench: "85%", healthStatus: "On Track" },
];

export default function SocialDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('CSR Activities');
  const [activities, setActivities] = useState(INITIAL_CSR_ACTIVITIES);
  const [queue, setQueue] = useState(INITIAL_PARTICIPATION_QUEUE);
  const [diversityMetrics] = useState(INITIAL_DIVERSITY_METRICS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Exact Electric Blue Color Token Definition
  const electricBlue = "#0086D6";

  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSearchTerm('');
    setSelectedRowId(null);
  };

  const handleToggleJoin = (id) => {
    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        return {
          ...act,
          joined: !act.joined,
          joinedCount: act.joined ? act.joinedCount - 1 : act.joinedCount + 1
        };
      }
      return act;
    }));
  };

  const handleProcessQueue = (statusTarget) => {
    if (!selectedRowId) return;
    setQueue(prev => prev.map(item => {
      if (item.id === selectedRowId) {
        return { ...item, status: statusTarget };
      }
      return item;
    }));
    setSelectedRowId(null);
  };

  return (
    <div className="text-slate-900 w-full space-y-6">
      {/* 1. TOP SUB-NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-300 pb-2 overflow-x-auto">
        {['CSR Activities', 'Employee Participation', 'Diversity Dashboard'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === tab 
                ? 'text-white shadow-sm font-black' 
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 border-b-0'
            }`}
            style={activeSubTab === tab ? { backgroundColor: electricBlue } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. DYNAMIC WORKSPACE UTILITY ACTIONS LAYER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center flex-wrap gap-2">
          <button 
            onClick={() => alert(`Launching configurator: + New ${activeSubTab.replace('ies', 'y').replace('s', '')}`)}
            className="text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: electricBlue }}
          >
            + New {activeSubTab === 'Diversity Dashboard' ? 'Metric Node' : activeSubTab === 'Employee Participation' ? 'Log entry' : 'Activity'}
          </button>
          
          {activeSubTab !== 'CSR Activities' && (
            <>
              <button 
                disabled={!selectedRowId}
                onClick={() => alert(`Modify Item Reference Target Payload ID: ${selectedRowId}`)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                  selectedRowId ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                Edit
              </button>
              <button 
                disabled={!selectedRowId}
                onClick={() => {
                  alert(`Purging index: ${selectedRowId}`);
                  setSelectedRowId(null);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                  selectedRowId ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                Delete
              </button>
            </>
          )}
          
          <button 
            onClick={() => alert(`Generating localized data CSV payload for ${activeSubTab}`)}
            className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-xl font-bold text-sm border border-slate-300 transition-all shadow-sm"
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
            className="bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 font-medium"
            style={{ '--tw-ring-color': electricBlue }}
          />
        </div>
      </div>

      {/* 3. SUB-TAB VIEW EXECUTION ENGINE */}
      
      {/* ================= VIEW 1: CSR ACTIVITIES ================= */}
      {activeSubTab === 'CSR Activities' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Active Events Deck</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activities.filter(act => act.title.toLowerCase().includes(searchTerm.toLowerCase())).map((activity) => (
                <div 
                  key={activity.id} 
                  className="bg-white border border-slate-300 p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:border-slate-400"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-black text-slate-900 tracking-tight text-base leading-tight">
                        {activity.title}
                      </h4>
                      {activity.evidenceRequired && (
                        <span className="text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded tracking-wide uppercase whitespace-nowrap">
                          📷 Proof Req.
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      Members: <span className="text-black font-black">{activity.joinedCount}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleJoin(activity.id)}
                    className="mt-5 w-full py-1.5 rounded-lg text-xs font-black tracking-wide border transition-all"
                    style={activity.joined 
                      ? { backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' } 
                      : { backgroundColor: electricBlue, color: '#ffffff', borderColor: electricBlue }
                    }
                  >
                    {activity.joined ? '✓ Joined' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* INTEGRATED PARTICIPATION APPROVAL QUEUE PANEL */}
          <BentoGlowEffect glowColor="0, 134, 214" spotlightRadius={260} className="p-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 px-1">
              Employee Participation Approval Queue
            </h3>
            
            <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
                <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-4 w-8"></th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Activity / Challenge</th>
                    <th className="p-4">Proof Attachment</th>
                    <th className="p-4 text-right">Points Value</th>
                    <th className="p-4 text-center">Status Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-black font-semibold">
                  {queue.map((row) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      style={selectedRowId === row.id ? { backgroundColor: 'rgba(0, 134, 214, 0.08)' } : {}}
                      onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedRowId === row.id} 
                          onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                          className="rounded border-slate-400 focus:ring-blue-500"
                          style={{ color: electricBlue }}
                        />
                      </td>
                      <td className="p-4 font-black text-slate-900">{row.employee}</td>
                      <td className="p-4 text-slate-800">{row.activity}</td>
                      <td className="p-4 font-mono text-xs">
                        <a 
                          href={`#view-proof-${row.id}`} 
                          onClick={(e) => { e.preventDefault(); alert(`Displaying proof payload file: ${row.proofUrl}`); }} 
                          className="underline font-bold"
                          style={{ color: electricBlue }}
                        >
                          🔗 {row.proofUrl}
                        </a>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-900 font-bold">+{row.points} XP</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border tracking-wide ${
                          row.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-300' :
                          row.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-300' :
                          'bg-amber-50 text-amber-600 border-amber-300 animate-pulse'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CONTEXTUAL CONSOLE CONTROL LINE ACTIONS FOOTER */}
            <div className="mt-4 flex items-center justify-between bg-white border border-slate-300 p-4 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-500">
                {selectedRowId ? `Selected Action Line ID: ${selectedRowId}` : "Select a pending queue item line to action validation"}
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={!selectedRowId}
                  onClick={() => handleProcessQueue('Rejected')}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wide border transition-all ${
                    selectedRowId ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  Reject
                </button>
                <button
                  disabled={!selectedRowId}
                  onClick={() => handleProcessQueue('Approved')}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wide border transition-all ${
                    selectedRowId ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  Approve
                </button>
              </div>
            </div>
          </BentoGlowEffect>
        </div>
      )}

      {/* ================= VIEW 2: EMPLOYEE PARTICIPATION ================= */}
      {activeSubTab === 'Employee Participation' && (
        <BentoGlowEffect glowColor="0, 134, 214" spotlightRadius={260} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Employee Contributor</th>
                  <th className="p-4">Activity Name</th>
                  <th className="p-4">Uploaded Validation Hash</th>
                  <th className="p-4 text-right">Gamification Reward</th>
                  <th className="p-4 text-center">Verification Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {queue.filter(item => item.employee.toLowerCase().includes(searchTerm.toLowerCase()) || item.activity.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    style={selectedRowId === row.id ? { backgroundColor: 'rgba(0, 134, 214, 0.08)' } : {}}
                    onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)} className="rounded border-slate-400" style={{ color: electricBlue }} />
                    </td>
                    <td className="p-4 font-black text-slate-900">{row.employee}</td>
                    <td className="p-4 text-slate-800">{row.activity}</td>
                    <td className="p-4 font-mono text-xs underline" style={{ color: electricBlue }}>🔗 {row.proofUrl}</td>
                    <td className="p-4 text-right font-mono text-slate-950">+{row.points} XP</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-xl text-xs font-black border ${row.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-300' : row.status === 'Rejected' ? 'bg-red-50 text-red-700 border-rose-300' : 'bg-amber-50 text-amber-600 border-amber-300'}`}>
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

      {/* ================= VIEW 3: DIVERSITY DASHBOARD ================= */}
      {activeSubTab === 'Diversity Dashboard' && (
        <BentoGlowEffect glowColor="0, 134, 214" spotlightRadius={260} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Demographic Metric Index</th>
                  <th className="p-4">Operational Department Scope</th>
                  <th className="p-4 text-right">Current Metric</th>
                  <th className="p-4 text-right">Target Goal</th>
                  <th className="p-4 w-44">Parity Progress</th>
                  <th className="p-4 text-right">Regional Benchmark</th>
                  <th className="p-4 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {diversityMetrics.filter(div => div.metric.toLowerCase().includes(searchTerm.toLowerCase()) || div.department.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => {
                  const progressPct = Math.min(Math.round((row.currentPct / row.targetPct) * 100), 100);
                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      style={selectedRowId === row.id ? { backgroundColor: 'rgba(0, 134, 214, 0.08)' } : {}}
                      onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)} className="rounded border-slate-400" style={{ color: electricBlue }} />
                      </td>
                      <td className="p-4 font-black text-slate-900">{row.metric}</td>
                      <td className="p-4 text-slate-800 text-xs font-bold">{row.department}</td>
                      <td className="p-4 text-right font-mono text-slate-950">{row.currentPct}%</td>
                      <td className="p-4 text-right font-mono text-slate-500">{row.targetPct}%</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-slate-200 rounded-full h-2 border border-slate-300/60">
                            <div 
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${progressPct}%`, 
                                backgroundColor: row.healthStatus === 'Needs Attention' ? '#f59e0b' : electricBlue 
                              }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-700">{progressPct}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-600">{row.regionalBench}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                          row.healthStatus === 'Target Met' ? 'bg-green-50 text-green-700 border-green-300' :
                          row.healthStatus === 'On Track' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                          'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                        }`}>
                          {row.healthStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* 4. UNIFIED COMPLIANCE FOOTER SIGNATURE NOTE */}
      <div className="pt-4 border-t border-slate-200 flex items-center text-xs text-slate-800 font-bold italic bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
        <span className="mr-2 font-black text-sm select-none" style={{ color: electricBlue }}>ℹ</span>
        <span>Corporate Social Responsibility (CSR) impact statements are audit-logged for annual ESG disclosure reporting.</span>
      </div>
    </div>
  );
}