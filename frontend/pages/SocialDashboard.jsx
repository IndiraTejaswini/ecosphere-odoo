import { useState, useEffect } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- BACKEND CONNECTION ---
import api, { API_BASE_URL } from '../api';

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toISOString().slice(0, 10);
}

export default function SocialDashboard({ userRole }) {
  const isAdmin = userRole === 'admin';
  const [activeSubTab, setActiveSubTab] = useState('CSR Activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);

  // --- BACKEND CONNECTION: real data ---
  const [currentUser, setCurrentUser] = useState(null);
  const [csrActivities, setCsrActivities] = useState([]);
  const [participations, setParticipations] = useState([]); // shared by CSR Activities' queue panel + Employee Participation tab
  const [diversityMetrics, setDiversityMetrics] = useState([]);
  const [trainingPrograms, setTrainingPrograms] = useState([]);
  const [trainingCompletions, setTrainingCompletions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [csrCategories, setCsrCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const electricBlue = '#0086D6';

  async function loadAllData() {
    setLoading(true);
    setLoadError('');
    try {
      const [meRes, activitiesRes, participationsRes, diversityRes, settingsRes, deptRes, categoriesRes, programsRes, completionsRes] = await Promise.allSettled([
        api.employees.me(),
        api.csr.listActivities({ limit: 100 }),
        api.csr.listParticipations({ limit: 100 }),
        api.diversity.list({ limit: 100 }),
        api.settings.get(),
        api.departments.list({ limit: 100 }),
        api.categories.list({ limit: 100 }),
        api.training.listPrograms({ limit: 100 }),
        api.training.listCompletions({ limit: 100 }), // auto-scoped to own assignments for non-admin
      ]);

      // Gap Fix: was Promise.all() - a single failed call (e.g. diversity
      // metrics, which nothing else here depends on) used to wipe out ALL 7
      // results, including `participations` - the exact data the CSR
      // approval queue and Employee Participation tab both depend on. A
      // transient failure in an unrelated call could make the entire
      // approval queue look "broken" or permanently empty.
      const failures = [];
      if (meRes.status === 'fulfilled') setCurrentUser(meRes.value);
      else failures.push('your profile');

      if (activitiesRes.status === 'fulfilled') setCsrActivities(activitiesRes.value.data);
      else failures.push('CSR activities');

      if (participationsRes.status === 'fulfilled') setParticipations(participationsRes.value.data);
      else failures.push('participation records');

      if (diversityRes.status === 'fulfilled') setDiversityMetrics(diversityRes.value.data);
      else failures.push('diversity metrics');

      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value);
      else failures.push('settings');

      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data);
      else failures.push('departments');

      if (categoriesRes.status === 'fulfilled') setCsrCategories(categoriesRes.value.data.filter((c) => c.type === 'CSR Activity'));
      else failures.push('categories');

      if (programsRes.status === 'fulfilled') setTrainingPrograms(programsRes.value.data);
      else failures.push('training programs');

      if (completionsRes.status === 'fulfilled') setTrainingCompletions(completionsRes.value.data);
      else failures.push('training completions');

      if (failures.length > 0) {
        console.error('Failed to load:', failures);
        setLoadError(`Failed to load: ${failures.join(', ')}. Try refreshing the page.`);
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load social data');
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

  function getJoinedCount(activityId) {
    return participations.filter((p) => p.activity?._id === activityId).length;
  }

  function myParticipationFor(activityId) {
    if (!currentUser) return null;
    return participations.find((p) => p.activity?._id === activityId && p.employee?._id === currentUser._id);
  }

  async function handleJoin(activityId) {
    try {
      await api.csr.joinActivity(activityId);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Could not join activity');
    }
  }

  async function handleCompleteTraining(completionId) {
    try {
      await api.training.complete(completionId);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Could not mark training complete');
    }
  }

  async function handleProcessQueue(decision) {
    if (!selectedRowId) return;
    try {
      await api.csr.reviewParticipation(selectedRowId, decision);
      setSelectedRowId(null);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Review action failed');
    }
  }

  function viewProof(proofUrl) {
    if (!proofUrl) {
      alert('No proof file attached.');
      return;
    }
    window.open(`${API_BASE_URL}${proofUrl}`, '_blank');
  }

  // --- BACKEND CONNECTION: "New X" create modals (CSR Activities / Diversity) ---
  function openCreateModal() {
    if (activeSubTab === 'CSR Activities') {
      setFormData({ title: '', category: '', description: '', date: '', location: '', expectedParticipants: '' });
    } else if (activeSubTab === 'Diversity Dashboard') {
      setFormData({ department: '', period: new Date().toISOString().slice(0, 7), headcountTotal: '', headcountFemale: '', headcountMale: '', headcountOther: '' });
    } else if (activeSubTab === 'Training') {
      setFormData({ title: '', description: '', department: '', mandatory: true, dueDate: '' });
    }
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeSubTab === 'CSR Activities') {
        await api.csr.createActivity({ ...formData, expectedParticipants: Number(formData.expectedParticipants) || undefined, status: 'Active' });
      } else if (activeSubTab === 'Diversity Dashboard') {
        await api.diversity.upsert({
          ...formData,
          headcountTotal: Number(formData.headcountTotal),
          headcountFemale: Number(formData.headcountFemale) || 0,
          headcountMale: Number(formData.headcountMale) || 0,
          headcountOther: Number(formData.headcountOther) || 0,
        });
      } else if (activeSubTab === 'Training') {
        const body = { ...formData };
        if (!body.department) delete body.department; // optional - blank means org-wide
        const result = await api.training.createProgram(body);
        alert(`✅ Training program created and auto-assigned to ${result.assignedTo} employee(s).`);
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
    return <div className="p-12 text-center text-slate-400 font-bold text-sm">Loading social data...</div>;
  }

  return (
    <div className="text-slate-900 w-full space-y-6">
      {/* 1. TOP SUB-NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-300 pb-2 overflow-x-auto">
        {['CSR Activities', 'Employee Participation', 'Diversity Dashboard', 'Training'].map((tab) => (
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

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl px-6 py-4">
          ⚠️ {loadError}
        </div>
      )}

      {/* 2. DYNAMIC WORKSPACE UTILITY ACTIONS LAYER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center flex-wrap gap-2">
          {isAdmin && !['Employee Participation', 'Training'].includes(activeSubTab) && (
            <button 
              onClick={openCreateModal}
              className="text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: electricBlue }}
            >
              + New {activeSubTab === 'Diversity Dashboard' ? 'Metric Entry' : 'Activity'}
            </button>
          )}
          {isAdmin && activeSubTab === 'Training' && (
            <button 
              onClick={openCreateModal}
              className="text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: electricBlue }}
            >
              + New Training Program
            </button>
          )}
          
          <button 
            onClick={() => api.reports.exportCsv({ module: 'social' }).catch((err) => alert(err.message))}
            className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-xl font-bold text-sm border border-slate-300 transition-all shadow-sm"
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
            className="bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* 3. SUB-TAB VIEW EXECUTION ENGINE */}
      
      {/* ================= VIEW 1: CSR ACTIVITIES ================= */}
      {activeSubTab === 'CSR Activities' && (
        <div className="space-y-8">
          {settings?.evidenceRequirementEnabled && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl px-4 py-2.5">
              📷 Evidence Requirement is enabled organization-wide — every activity below requires a proof file before approval (this is a global Settings toggle, not per-activity).
            </div>
          )}

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Active Events Deck</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {csrActivities.filter(act => act.title.toLowerCase().includes(searchTerm.toLowerCase())).map((activity) => {
                const myParticipation = myParticipationFor(activity._id);
                return (
                  <div 
                    key={activity._id} 
                    className="bg-white border border-slate-300 p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:border-slate-400"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="font-black text-slate-900 tracking-tight text-base leading-tight">
                          {activity.title}
                        </h4>
                        {settings?.evidenceRequirementEnabled && (
                          <span className="text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded tracking-wide uppercase whitespace-nowrap">
                            📷 Proof Req.
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        Members: <span className="text-black font-black">{getJoinedCount(activity._id)}</span>
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{formatDate(activity.date)} · {activity.location || 'No location set'}</p>
                    </div>

                    <button
                      onClick={() => !myParticipation && handleJoin(activity._id)}
                      disabled={Boolean(myParticipation)}
                      className="mt-5 w-full py-1.5 rounded-lg text-xs font-black tracking-wide border transition-all disabled:cursor-default"
                      style={myParticipation 
                        ? { backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' } 
                        : { backgroundColor: electricBlue, color: '#ffffff', borderColor: electricBlue }
                      }
                    >
                      {myParticipation ? `✓ ${myParticipation.approvalStatus}` : 'Join'}
                    </button>
                  </div>
                );
              })}
              {csrActivities.length === 0 && <p className="text-sm text-slate-400 font-bold">No CSR activities yet.</p>}
            </div>
          </div>

          {/* INTEGRATED PARTICIPATION APPROVAL QUEUE PANEL - admin only.
              Reviewing OTHER people's submissions is a management action
              (PUT /csr/participations/:id/review is requireAdmin on the
              backend); employees shouldn't see this panel at all, not just
              have its buttons fail on click. */}
          {isAdmin && (
          <BentoGlowEffect glowColor="0, 134, 214" spotlightRadius={260} className="p-1">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Employee Participation Approval Queue
              </h3>
              {participations.filter((p) => p.approvalStatus === 'Pending').length > 0 && (
                <span className="text-[10px] font-black text-white bg-amber-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {participations.filter((p) => p.approvalStatus === 'Pending').length} pending review
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
                <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-4 w-8"></th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Activity</th>
                    <th className="p-4">Proof Attachment</th>
                    <th className="p-4 text-right">Points Value</th>
                    <th className="p-4 text-center">Status Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-black font-semibold">
                  {participations.filter((p) => p.approvalStatus === 'Pending').map((row) => (
                    <tr 
                      key={row._id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      style={selectedRowId === row._id ? { backgroundColor: 'rgba(0, 134, 214, 0.08)' } : {}}
                      onClick={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedRowId === row._id} 
                          onChange={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}
                          className="rounded border-slate-400 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-4 font-black text-slate-900">{row.employee?.name || '—'}</td>
                      <td className="p-4 text-slate-800">{row.activity?.title || '—'}</td>
                      <td className="p-4 font-mono text-xs">
                        <button
                          onClick={(e) => { e.stopPropagation(); viewProof(row.proofUrl); }}
                          className="underline font-bold"
                          style={{ color: electricBlue }}
                        >
                          {row.proofUrl ? '🔗 View proof' : '— No proof'}
                        </button>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-900 font-bold">+{row.pointsEarned || 0} pts</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black border tracking-wide bg-amber-50 text-amber-600 border-amber-300 animate-pulse">
                          {row.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {participations.filter((p) => p.approvalStatus === 'Pending').length === 0 && (
                    <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-bold">No pending submissions to review.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTEXTUAL CONSOLE CONTROL LINE ACTIONS FOOTER */}
            <div className="mt-4 flex items-center justify-between bg-white border border-slate-300 p-4 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-500">
                {selectedRowId ? `Selected a pending submission` : "Select a pending queue item line to action validation"}
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
          )}
        </div>
      )}

      {/* ================= VIEW 2: EMPLOYEE PARTICIPATION ================= */}
      {activeSubTab === 'Employee Participation' && (
        <BentoGlowEffect glowColor="0, 134, 214" spotlightRadius={260} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4">Employee Contributor</th>
                  <th className="p-4">Activity Name</th>
                  <th className="p-4">Proof</th>
                  <th className="p-4 text-right">Points Earned</th>
                  <th className="p-4 text-center">Verification Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {participations.filter(item => (item.employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.activity?.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-900">{row.employee?.name || '—'}</td>
                    <td className="p-4 text-slate-800">{row.activity?.title || '—'}</td>
                    <td className="p-4 font-mono text-xs">
                      <button onClick={() => viewProof(row.proofUrl)} className="underline font-bold" style={{ color: electricBlue }}>
                        {row.proofUrl ? '🔗 View' : '— None'}
                      </button>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-950">+{row.pointsEarned || 0} pts</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-xl text-xs font-black border ${row.approvalStatus === 'Approved' ? 'bg-green-50 text-green-700 border-green-300' : row.approvalStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-rose-300' : 'bg-amber-50 text-amber-600 border-amber-300'}`}>
                        {row.approvalStatus}
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
      {/* NOTE: the real DiversityMetric model only tracks a gender headcount
          breakdown per department+period - no named sub-metrics, no target %,
          no regional benchmark, no computed health status exist server-side.
          Those were dropped rather than fabricated. */}
      {activeSubTab === 'Diversity Dashboard' && (
        <BentoGlowEffect glowColor="0, 134, 214" spotlightRadius={260} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4">Department</th>
                  <th className="p-4">Period</th>
                  <th className="p-4 text-right">Total Headcount</th>
                  <th className="p-4 text-right">Female</th>
                  <th className="p-4 text-right">Male</th>
                  <th className="p-4 text-right">Other</th>
                  <th className="p-4 w-44">Female %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {diversityMetrics
                  .filter(row => (row.department?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-900">{row.department?.name || '—'}</td>
                    <td className="p-4 text-slate-700 font-mono text-xs">{row.period}</td>
                    <td className="p-4 text-right font-mono text-slate-950">{row.headcountTotal}</td>
                    <td className="p-4 text-right font-mono text-slate-700">{row.headcountFemale}</td>
                    <td className="p-4 text-right font-mono text-slate-700">{row.headcountMale}</td>
                    <td className="p-4 text-right font-mono text-slate-700">{row.headcountOther}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 border border-slate-300/60">
                          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${row.femalePercentage}%`, backgroundColor: electricBlue }}></div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-700">{row.femalePercentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {diversityMetrics.length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-bold">No diversity metrics logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 4: TRAINING (Gap Fix - Section 6 requires
          "Training Completion" as a Social feature; the backend fully
          supported it and even blends completion rate into the real Social
          score, but there was no UI to interact with it at all until now) ================= */}
      {activeSubTab === 'Training' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Training Programs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingPrograms.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((program) => (
                <div key={program._id} className="bg-white border border-slate-300 p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-black text-slate-900 tracking-tight text-base leading-tight">{program.title}</h4>
                    {program.mandatory && (
                      <span className="text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-300 px-1.5 py-0.5 rounded tracking-wide uppercase whitespace-nowrap">
                        Mandatory
                      </span>
                    )}
                  </div>
                  {program.description && <p className="text-xs text-slate-500 mb-2">{program.description}</p>}
                  <p className="text-[10px] font-mono text-slate-400">
                    {program.department?.name || 'Org-wide'} {program.dueDate ? `· Due ${formatDate(program.dueDate)}` : ''}
                  </p>
                </div>
              ))}
              {trainingPrograms.length === 0 && <p className="text-sm text-slate-400 font-bold">No training programs yet.</p>}
            </div>
          </div>

          <BentoGlowEffect glowColor="0, 134, 214" spotlightRadius={260} className="p-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 px-1">
              {isAdmin ? 'All Training Assignments' : 'Your Training Assignments'}
            </h3>
            <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
                <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                  <tr>
                    {isAdmin && <th className="p-4">Employee</th>}
                    <th className="p-4">Program</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Completed</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-black font-semibold">
                  {trainingCompletions
                    .filter((c) => (c.trainingProgram?.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      {isAdmin && <td className="p-4 font-black text-slate-900">{c.employee?.name || '—'}</td>}
                      <td className="p-4 text-slate-800">{c.trainingProgram?.title || '—'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${c.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-amber-50 text-amber-600 border-amber-300'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-xs text-slate-500">{c.completedAt ? formatDate(c.completedAt) : '—'}</td>
                      <td className="p-4 text-center">
                        {c.status === 'Assigned' && (isAdmin || c.employee?._id === currentUser?._id) ? (
                          <button onClick={() => handleCompleteTraining(c._id)} className="text-xs font-black text-white px-3 py-1 rounded" style={{ backgroundColor: electricBlue }}>
                            Mark Complete
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {trainingCompletions.length === 0 && (
                    <tr><td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-slate-400 font-bold">No training assignments yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </BentoGlowEffect>
        </div>
      )}

      {/* 4. UNIFIED COMPLIANCE FOOTER SIGNATURE NOTE */}
      <div className="pt-4 border-t border-slate-200 flex items-center text-xs text-slate-800 font-bold italic bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
        <span className="mr-2 font-black text-sm select-none" style={{ color: electricBlue }}>ℹ</span>
        <span>Corporate Social Responsibility (CSR) impact statements are audit-logged for annual ESG disclosure reporting.</span>
      </div>

      {/* --- BACKEND CONNECTION: create modal (CSR Activities / Diversity) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              New {activeSubTab === 'Diversity Dashboard' ? 'Diversity Metric Entry' : activeSubTab === 'Training' ? 'Training Program' : 'CSR Activity'}
            </h3>

            {activeSubTab === 'CSR Activities' && (
              <>
                <input required placeholder="Activity Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select required value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select category...</option>
                  {csrCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input placeholder="Location" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="Expected Participants" value={formData.expectedParticipants} onChange={(e) => setFormData({ ...formData, expectedParticipants: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </>
            )}

            {activeSubTab === 'Diversity Dashboard' && (
              <>
                <select required value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select department...</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <input required placeholder="Period (e.g. 2026-07)" value={formData.period || ''} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="number" placeholder="Total Headcount" value={formData.headcountTotal} onChange={(e) => setFormData({ ...formData, headcountTotal: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="Female Headcount" value={formData.headcountFemale} onChange={(e) => setFormData({ ...formData, headcountFemale: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="Male Headcount" value={formData.headcountMale} onChange={(e) => setFormData({ ...formData, headcountMale: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="Other Headcount" value={formData.headcountOther} onChange={(e) => setFormData({ ...formData, headcountOther: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <p className="text-xs text-slate-500">Submitting again for the same department + period updates that entry rather than duplicating it.</p>
              </>
            )}

            {activeSubTab === 'Training' && (
              <>
                <input required placeholder="Program Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Org-wide (all employees)</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name} only</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={formData.mandatory} onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })} />
                  Mandatory
                </label>
                <input type="date" value={formData.dueDate || ''} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <p className="text-xs text-slate-500">Creating this immediately assigns it to every matching employee (org-wide or department-scoped).</p>
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded font-bold text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded font-bold text-sm text-white disabled:opacity-50" style={{ backgroundColor: electricBlue }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}