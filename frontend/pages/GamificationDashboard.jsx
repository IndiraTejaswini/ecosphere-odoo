import { useState, useEffect, Fragment } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- BACKEND CONNECTION ---
import api from '../api';

const DIFFICULTY_ICONS = { Easy: '♻️', Medium: '🚲', Hard: '🌐' };
const CHALLENGE_STAGES = ['Draft', 'Active', 'Under Review', 'Completed', 'Archived'];

// Badge has no "tier" field on the backend - derived here from unlockValue as
// a reasonable UI heuristic, not real stored data.
function deriveTier(badge) {
  const threshold = badge.unlockType === 'xp' ? [100, 300] : [3, 6];
  if (badge.unlockValue < threshold[0]) return 'Bronze';
  if (badge.unlockValue < threshold[1]) return 'Silver';
  return 'Gold';
}

function deriveCriteria(badge) {
  return badge.unlockType === 'xp' ? `Earn ${badge.unlockValue} XP` : `Complete ${badge.unlockValue} challenges`;
}

// Backend only stores approvalStatus (Pending/Approved/Rejected) + a separate
// progress % - "In Progress / Completed / Pending Start" is derived here.
function deriveParticipationStatus(p) {
  if (p.approvalStatus === 'Approved') return 'Completed';
  if (p.approvalStatus === 'Rejected') return 'Rejected';
  if (p.progress === 0) return 'Pending Start';
  return 'In Progress';
}

export default function GamificationDashboard({ userRole }) {
  const isAdmin = userRole === 'admin';
  const [activeSubTab, setActiveSubTab] = useState('Challenges');

  // --- BACKEND CONNECTION: real data ---
  const [currentUser, setCurrentUser] = useState(null);
  const [challenges, setChallenges] = useState([]); // all statuses (for stage-rail counts)
  const [participation, setParticipation] = useState([]);
  const [badges, setBadges] = useState([]);
  const [badgeUnlockCounts, setBadgeUnlockCounts] = useState({}); // { badgeId: count } - admin only, may stay empty
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challengeCategories, setChallengeCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const gamificationOrange = '#D45B25';

  async function loadAllData() {
    setLoading(true);
    setLoadError('');
    try {
      const [meRes, challengesRes, participationRes, badgesRes, rewardsRes, leaderboardRes, categoriesRes] = await Promise.allSettled([
        api.employees.me(),
        api.challenges.list({ limit: 100 }),
        api.challenges.listParticipations({ limit: 100 }),
        api.badges.list({ limit: 100 }),
        api.rewardsCatalog.list({ limit: 100 }),
        api.leaderboard.get(),
        api.categories.list({ limit: 100 }),
      ]);

      // Gap Fix: was Promise.all() - one failed call used to wipe out ALL 7
      // results, not just that one. allSettled means a single failed source
      // degrades gracefully instead of blanking the whole page.
      const failures = [];
      if (meRes.status === 'fulfilled') setCurrentUser(meRes.value);
      else failures.push('your profile');

      if (challengesRes.status === 'fulfilled') setChallenges(challengesRes.value.data);
      else failures.push('challenges');

      if (participationRes.status === 'fulfilled') setParticipation(participationRes.value.data);
      else failures.push('challenge participation');

      if (badgesRes.status === 'fulfilled') setBadges(badgesRes.value.data);
      else failures.push('badges');

      if (rewardsRes.status === 'fulfilled') setRewards(rewardsRes.value.data);
      else failures.push('rewards');

      if (leaderboardRes.status === 'fulfilled') setLeaderboard(leaderboardRes.value.leaderboard);
      else failures.push('leaderboard');

      if (categoriesRes.status === 'fulfilled') setChallengeCategories(categoriesRes.value.data.filter((c) => c.type === 'Challenge'));
      else failures.push('categories');

      if (failures.length > 0) {
        console.error('Failed to load:', failures);
        setLoadError(`Failed to load: ${failures.join(', ')}. Try refreshing the page.`);
      }

      // Badge unlock counts: admin-only data (employee list). Fails silently
      // to an empty count map for non-admin users rather than breaking the tab.
      try {
        const { data: allEmployees } = await api.employees.list({ limit: 100 });
        const counts = {};
        allEmployees.forEach((emp) => {
          (emp.badges || []).forEach((badgeId) => {
            const key = String(badgeId);
            counts[key] = (counts[key] || 0) + 1;
          });
        });
        setBadgeUnlockCounts(counts);
      } catch {
        setBadgeUnlockCounts({});
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load gamification data');
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

  // Is the current user already participating in this challenge?
  function myParticipationFor(challengeId) {
    if (!currentUser) return null;
    return participation.find((p) => p.challenge?._id === challengeId && p.employee?._id === currentUser._id);
  }

  async function handleJoin(challengeId) {
    try {
      await api.challenges.join(challengeId);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Could not join challenge');
    }
  }

  async function handleStatusChange(challengeId, newStatus) {
    try {
      await api.challenges.updateStatus(challengeId, newStatus);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Status transition not allowed');
    }
  }

  async function handleRedeem(rewardId) {
    try {
      const result = await api.rewards.redeem(rewardId);
      alert(`Redeemed! Remaining points: ${result.remainingPoints}`);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Redemption failed');
    }
  }

  // --- BACKEND CONNECTION: "New X" create modals (Challenges/Badges/Rewards) ---
  function openCreateModal() {
    const defaults = {
      Challenges: { title: '', category: '', description: '', xp: '', difficulty: 'Medium', evidenceRequired: true, deadline: '' },
      Badges: { name: '', description: '', icon: '🏅', unlockType: 'xp', unlockValue: '' },
      Rewards: { name: '', description: '', pointsRequired: '', stockCount: '' },
    };
    setFormData(defaults[activeSubTab] || {});
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeSubTab === 'Challenges') {
        await api.challenges.create({ ...formData, xp: Number(formData.xp) });
      } else if (activeSubTab === 'Badges') {
        await api.badges.create({ ...formData, unlockValue: Number(formData.unlockValue) });
      } else if (activeSubTab === 'Rewards') {
        await api.rewardsCatalog.create({ ...formData, pointsRequired: Number(formData.pointsRequired), stockCount: Number(formData.stockCount) });
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

  const activeChallenges = challenges.filter((c) => c.status === 'Active');
  const stageCounts = CHALLENGE_STAGES.reduce((acc, s) => ({ ...acc, [s]: challenges.filter((c) => c.status === s).length }), {});

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-bold text-sm">Loading gamification data...</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col gap-6">
      
      {/* BRAND HEADER CANVAS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <span style={{ color: gamificationOrange }}>🎮</span> EcoSphere Gamification Module
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Track engagement milestones, assign rewards, and view real-time organizational leaderboards.
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
        {['Challenges', 'Challenge Participation', 'Badges', 'Rewards', 'Leaderboard'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === tab 
                ? 'text-white shadow-sm font-black' 
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 border-b-0'
            }`}
            style={activeSubTab === tab ? { backgroundColor: gamificationOrange } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. AUTOMATION ROW OPERATORS CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center flex-wrap gap-2">
          {isAdmin && ['Challenges', 'Badges', 'Rewards'].includes(activeSubTab) && (
            <button 
              onClick={openCreateModal}
              className="text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: gamificationOrange }}
            >
              + New {activeSubTab === 'Challenges' ? 'Challenge' : activeSubTab === 'Rewards' ? 'Incentive Store Perk' : 'Badge Milestone'}
            </button>
          )}
          <button 
            onClick={() => api.reports.exportCsv({ module: 'social' }).catch((err) => alert(err.message))}
            className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded font-bold text-sm border border-slate-300 transition-all shadow-sm"
          >
            Export Logs
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder={`Filter through ${activeSubTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 text-sm w-64 focus:outline-none transition-all placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* 3. SUB-TAB VIEW CORE ROUTER CHASSIS */}
      
      {/* ================= VIEW 1: CHALLENGES ================= */}
      {activeSubTab === 'Challenges' && (
        <div className="space-y-8">
          {/* HORIZONTAL STAGE TRAIN RAIL - now shows real counts per lifecycle stage */}
          <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm overflow-x-auto">
            <div className="flex items-center min-w-[760px] justify-between text-xs font-black uppercase tracking-wider text-slate-400">
              {CHALLENGE_STAGES.map((stage, i) => (
                <Fragment key={stage}>
                  <div className={`flex-1 text-center py-2.5 rounded-lg border ${
                    stage === 'Active' ? 'bg-green-50/60 border-2 border-green-500 text-green-800 font-black shadow-sm' :
                    stage === 'Under Review' ? 'bg-purple-50/60 border-2 border-purple-500 text-purple-800 font-black' :
                    stage === 'Completed' ? 'bg-blue-50/60 border-2 border-blue-500 text-blue-800 font-black' :
                    stage === 'Archived' ? 'bg-slate-100 border-slate-200 text-slate-400' :
                    'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    {stage} <span className="font-mono">({stageCounts[stage]})</span>
                  </div>
                  {i < CHALLENGE_STAGES.length - 1 && <div className="px-3 font-bold text-slate-300">➔</div>}
                </Fragment>
              ))}
            </div>
          </div>

          {/* ACTIVE CHALLENGES BENTO GRID */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 px-1">Active Corporate Challenges Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeChallenges.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => {
                const myParticipation = myParticipationFor(item._id);
                return (
                  <div key={item._id} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden border-2" style={{ borderColor: gamificationOrange }}>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl select-none">{DIFFICULTY_ICONS[item.difficulty] || '🎯'}</span>
                        {isAdmin ? (
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item._id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-300 cursor-pointer"
                          >
                            {CHALLENGE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-300">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-slate-900 tracking-tight text-lg mb-1">{item.title}</h4>
                      <div className="text-xs font-bold text-slate-500 space-y-1 mt-2">
                        <p>Reward Matrix: <span className="text-slate-950 font-black">XP: {item.xp} • {item.difficulty}</span></p>
                        <p>Time Constraints: <span className="text-slate-950 font-black">Deadline {new Date(item.deadline).toLocaleDateString()}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => !myParticipation && handleJoin(item._id)}
                      disabled={Boolean(myParticipation)}
                      className="mt-6 w-full py-2 rounded-xl text-xs font-black tracking-wide text-white transition-all uppercase hover:opacity-90 active:scale-[0.98] disabled:cursor-default"
                      style={{ backgroundColor: myParticipation ? '#334155' : gamificationOrange }}
                    >
                      {myParticipation ? `✓ ${deriveParticipationStatus(myParticipation)} (${myParticipation.progress}%)` : 'Join Challenge'}
                    </button>
                  </div>
                );
              })}
              {activeChallenges.length === 0 && <p className="text-sm text-slate-400 font-bold">No Active challenges right now.</p>}
            </div>
          </div>

          {/* LOWER TWO-PANEL COMPACT PREVIEW DISPLAY SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-slate-300 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black tracking-tight text-slate-950 mb-4 flex items-center gap-2">🌱 Badge Gallery Ledger</h3>
              <div className="grid grid-cols-2 gap-3">
                {badges.slice(0, 4).map((b) => (
                  <div key={b._id} className="bg-amber-50/60 p-3 rounded-xl flex items-center space-x-3 border" style={{ borderColor: 'rgba(212, 91, 37, 0.25)' }}>
                    <span className="text-xl select-none">{b.icon}</span>
                    <span className="text-xs font-black text-amber-900 tracking-tight leading-tight">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 bg-white border border-slate-300 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black tracking-tight text-slate-950 mb-4 flex items-center gap-2">🏆 Top Performers Leaderboard</h3>
              <div className="space-y-2 font-bold text-xs">
                {leaderboard.slice(0, 3).map((l) => (
                  <div key={l.rank} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg">
                    <span className="text-slate-400 font-mono font-black w-6">#{l.rank}</span>
                    <span className="flex-1 text-slate-900 font-black">{l.name}</span>
                    <span className="font-mono font-black" style={{ color: gamificationOrange }}>{l.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: CHALLENGE PARTICIPATION ================= */}
      {activeSubTab === 'Challenge Participation' && (
        <BentoGlowEffect glowColor="212, 91, 37" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Staff Contributor</th>
                  <th className="p-4">Enrolled Challenge Event</th>
                  <th className="p-4">Enrollment Timestamp</th>
                  <th className="p-4 w-64">Objective Metric Delta</th>
                  <th className="p-4 text-center">Execution Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {participation
                  .filter(p => (p.employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.challenge?.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((row) => {
                    const status = deriveParticipationStatus(row);
                    return (
                      <tr key={row._id} className="hover:bg-slate-50 transition-colors cursor-pointer" style={selectedRowId === row._id ? { backgroundColor: 'rgba(212, 91, 37, 0.06)' } : {}} onClick={() => setSelectedRowId(row._id === selectedRowId ? null : row._id)}>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedRowId === row._id} readOnly className="rounded border-slate-400" />
                        </td>
                        <td className="p-4 font-black text-slate-900">{row.employee?.name || '—'}</td>
                        <td className="p-4 text-slate-800 font-black">{row.challenge?.title || '—'}</td>
                        <td className="p-4 font-mono text-xs text-slate-500">{new Date(row.createdAt).toISOString().slice(0, 10)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300/60">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${row.progress}%`, backgroundColor: gamificationOrange }}></div>
                            </div>
                            <span className="font-mono font-black text-xs min-w-[32px] text-right">{row.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${status === 'Completed' ? 'bg-green-50 text-green-700 border-green-300' : status === 'Pending Start' ? 'bg-slate-100 text-slate-500 border-slate-300' : status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 3: BADGES ================= */}
      {activeSubTab === 'Badges' && (
        <BentoGlowEffect glowColor="212, 91, 37" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-16 text-center">Icon</th>
                  <th className="p-4">Badge Designation Title</th>
                  <th className="p-4">Unlocking Validation Criteria</th>
                  <th className="p-4 text-center">Tier Class *</th>
                  <th className="p-4 text-right">Global Fleet Issuances *</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {badges.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => {
                  const tier = deriveTier(row);
                  const count = badgeUnlockCounts[row._id];
                  return (
                    <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-center text-2xl select-none">{row.icon}</td>
                      <td className="p-4 text-slate-900 font-black">{row.name}</td>
                      <td className="p-4 text-slate-500 text-xs font-medium max-w-sm">{row.description || deriveCriteria(row)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-black text-xs border uppercase ${tier === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-300' : tier === 'Silver' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-orange-50/50 text-orange-800 border-orange-200'}`}>{tier}</span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-slate-950">{count !== undefined ? `${count} Users` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[11px] text-slate-400 font-semibold p-3 border-t border-slate-200">* Tier is a derived UI estimate (not stored on the backend); Global Fleet Issuances requires admin access.</p>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 4: REWARDS STORE ================= */}
      {activeSubTab === 'Rewards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {rewards.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map((reward) => (
              <div key={reward._id} className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all hover:border-slate-400">
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1">{reward.status}</span>
                  <h4 className="font-black text-slate-900 tracking-tight text-base leading-tight mb-2">{reward.name}</h4>
                  {reward.description && <p className="text-xs text-slate-500 font-medium mb-2">{reward.description}</p>}
                  <p className="text-xs text-slate-500 font-bold">Remaining Allocations: <span className="text-black font-black">{reward.stockCount} units</span></p>
                </div>
                <button onClick={() => handleRedeem(reward._id)} className="mt-4 w-full py-1.5 rounded-lg text-xs font-black tracking-wide border text-white transition-all uppercase" style={{ backgroundColor: gamificationOrange, borderColor: gamificationOrange }}>
                  Redeem / {reward.pointsRequired.toLocaleString()} pts
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VIEW 5: LEADERBOARD MATRIX ================= */}
      {/* NOTE: backend leaderboard is employee-only (ranked by XP) - no
          department rows and no "contributions" count exist server-side,
          so those were dropped rather than fabricated. */}
      {activeSubTab === 'Leaderboard' && (
        <BentoGlowEffect glowColor="212, 91, 37" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-20 text-center">Standing</th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Department</th>
                  <th className="p-4 text-right">XP</th>
                  <th className="p-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {leaderboard.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr key={row.rank} className="hover:bg-slate-50/90 transition-colors">
                    <td className="p-4 text-center font-mono font-black text-base text-slate-500">#{row.rank}</td>
                    <td className="p-4 text-slate-900 text-base font-black flex items-center space-x-2">
                      <span>{row.name}</span>
                      {row.rank <= 3 && <span className="text-xs select-none">🔥</span>}
                    </td>
                    <td className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide">{row.department || '—'}</td>
                    <td className="p-4 text-right font-mono font-black text-base" style={{ color: gamificationOrange }}>{row.xp.toLocaleString()} XP</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-700">{row.points.toLocaleString()} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* 4. REWARDS AND INCENTIVES COMPLIANCE CONSOLE FOOTER */}
      <div className="mt-auto pt-4 border-t border-slate-200 flex items-center text-xs text-slate-800 font-bold italic bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
        <span className="mr-2 font-black text-sm select-none" style={{ color: gamificationOrange }}>💡</span>
        <span>Gamified achievements convert verified impact data entries directly into corporate sustainability tokens.</span>
      </div>

      {/* --- BACKEND CONNECTION: create modal (Challenges/Badges/Rewards) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-black text-slate-900">New {activeSubTab === 'Challenges' ? 'Challenge' : activeSubTab === 'Rewards' ? 'Reward' : 'Badge'}</h3>

            {activeSubTab === 'Challenges' && (
              <>
                <input required placeholder="Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select required value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">Select category...</option>
                  {challengeCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="number" placeholder="XP Reward" value={formData.xp} onChange={(e) => setFormData({ ...formData, xp: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  {['Easy', 'Medium', 'Hard'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={formData.evidenceRequired} onChange={(e) => setFormData({ ...formData, evidenceRequired: e.target.checked })} />
                  Evidence required to complete
                </label>
                <input required type="date" value={formData.deadline || ''} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <p className="text-xs text-slate-500">New challenges start as "Draft" - change status to "Active" from the challenge card once ready.</p>
              </>
            )}

            {activeSubTab === 'Badges' && (
              <>
                <input required placeholder="Badge Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input placeholder="Icon (emoji)" value={formData.icon || ''} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <select value={formData.unlockType} onChange={(e) => setFormData({ ...formData, unlockType: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="xp">Unlock by XP threshold</option>
                  <option value="challenges">Unlock by completed-challenge count</option>
                </select>
                <input required type="number" placeholder={formData.unlockType === 'xp' ? 'XP required' : 'Challenges required'} value={formData.unlockValue} onChange={(e) => setFormData({ ...formData, unlockValue: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </>
            )}

            {activeSubTab === 'Rewards' && (
              <>
                <input required placeholder="Reward Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="number" placeholder="Points Required" value={formData.pointsRequired} onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                <input required type="number" placeholder="Stock Count" value={formData.stockCount} onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded font-bold text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded font-bold text-sm text-white disabled:opacity-50" style={{ backgroundColor: gamificationOrange }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}