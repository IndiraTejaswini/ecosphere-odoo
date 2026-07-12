import { useState } from 'react';
import BentoGlowEffect from '../components/BentoGlowEffect';

// --- MOCK REGISTRY FOR CHALLENGES ---
const INITIAL_CHALLENGES = [
  { id: 401, title: "Sustainability Sprint", xp: 200, difficulty: "Hard", deadline: "07/20", icon: "🌐", status: "Active" },
  { id: 402, title: "Recycle Challenge", xp: 80, difficulty: "Easy", deadline: "07/15", icon: "♻️", status: "Active" },
  { id: 403, title: "Commute Green Week", xp: 120, difficulty: "Medium", deadline: "07/25", icon: "🚲", status: "Draft" },
];

// --- MOCK REGISTRY FOR CHALLENGE PARTICIPATION LOGS ---
const INITIAL_PARTICIPATION = [
  { id: 1, employee: "Sarah Jenkins", challenge: "Sustainability Sprint", progress: 75, status: "In Progress", joinedDate: "2026-06-12" },
  { id: 2, employee: "Michael Chang", challenge: "Recycle Challenge", progress: 100, status: "Completed", joinedDate: "2026-06-14" },
  { id: 3, employee: "Elena Rostova", challenge: "Sustainability Sprint", progress: 20, status: "In Progress", joinedDate: "2026-06-18" },
  { id: 4, employee: "David Kojo", challenge: "Commute Green Week", progress: 0, status: "Pending Start", joinedDate: "2026-07-01" },
];

// --- MOCK REGISTRY FOR ALL AVAILABLE BADGES ---
const INITIAL_BADGES = [
  { id: 101, name: "Green Beginner", criteria: "Complete 1st sustainability challenge", tier: "Bronze", unlockedCount: 142, icon: "🌱" },
  { id: 102, name: "Carbon Saver", criteria: "Reduce individual commute emissions by 20%", tier: "Silver", unlockedCount: 68, icon: "♻️" },
  { id: 103, name: "Sustainability Champion", criteria: "Maintain a top-3 leaderboard rank for 4 weeks", tier: "Gold", unlockedCount: 12, icon: "🌏" },
  { id: 104, name: "Team Player", criteria: "Join a cross-departmental cleanup drive", tier: "Bronze", unlockedCount: 89, icon: "⭐️" },
];

// --- MOCK REGISTRY FOR CORPORATE REWARDS INCENTIVES STORE ---
const INITIAL_REWARDS = [
  { id: 201, product: "Premium EV Parking Pass (1 Month)", cost: "1,500 XP", stock: 14, category: "Infrastructure" },
  { id: 202, product: "EcoSphere Branded Recycled Apparel", cost: "600 XP", stock: 45, category: "Merchandise" },
  { id: 203, product: "Subsidized Public Transit Voucher", cost: "800 XP", stock: 120, category: "Subsidy" },
  { id: 204, product: "Tree Foundation Donation Certificate", cost: "300 XP", stock: 999, category: "Charity" },
];

// --- MOCK REGISTRY FOR FULL LEADERBOARD DATA MATRIX ---
const INITIAL_LEADERBOARD = [
  { rank: 1, name: "Manufacturing Dept", type: "Department", contributions: 34, xp: 4820 },
  { rank: 2, name: "Aditi Rao", type: "Employee", contributions: 12, xp: 3910 },
  { rank: 3, name: "Corporate Dept", type: "Department", contributions: 28, xp: 3505 },
  { rank: 4, name: "Marcus Vance", type: "Employee", contributions: 9, xp: 3120 },
  { rank: 5, name: "Logistics Division", type: "Department", contributions: 19, xp: 2940 },
];

export default function GamificationDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('Challenges');
  const [challenges] = useState(INITIAL_CHALLENGES);
  const [participation] = useState(INITIAL_PARTICIPATION);
  const [badges] = useState(INITIAL_BADGES);
  const [rewards] = useState(INITIAL_REWARDS);
  const [leaderboard] = useState(INITIAL_LEADERBOARD);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [joinedTrack, setJoinedTrack] = useState({});

  const gamificationOrange = "#D45B25";

  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSearchTerm('');
    setSelectedRowId(null);
  };

  const handleToggleJoin = (id) => {
    setJoinedTrack(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
          <button 
            onClick={() => alert(`Launching configurator payload array wizard for: + New Gamified ${activeSubTab.replace('s', '')}`)}
            className="text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: gamificationOrange }}
          >
            + New {activeSubTab === 'Challenges' ? 'Challenge' : activeSubTab === 'Rewards' ? 'Incentive Store Perk' : activeSubTab === 'Badges' ? 'Badge Milestone' : 'Record'}
          </button>
          <button 
            onClick={() => alert(`Compiling tabular export matrix download for ${activeSubTab}...`)}
            className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded font-bold text-sm border border-slate-300 transition-all shadow-sm"
          >
            Export Logs ▾
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

      {/* 3. SUB-TAB VIEW CORE ROUTER CHASSIS */}
      
      {/* ================= VIEW 1: CHALLENGES ================= */}
      {activeSubTab === 'Challenges' && (
        <div className="space-y-8">
          {/* HORIZONTAL STAGE TRAIN RAIL */}
          <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm overflow-x-auto">
            <div className="flex items-center min-w-[760px] justify-between text-xs font-black uppercase tracking-wider text-slate-400">
              <div className="flex-1 text-center bg-slate-50 border border-slate-200 py-2.5 rounded-lg text-slate-600">Draft Mode</div>
              <div className="px-3 font-bold text-slate-300">➔</div>
              <div className="flex-1 text-center bg-green-50/60 border-2 border-green-500 py-2.5 rounded-lg text-green-800 font-black shadow-sm">Active State</div>
              <div className="px-3 font-bold text-slate-300">➔</div>
              <div className="flex-1 text-center bg-purple-50/60 border-2 border-purple-500 py-2.5 rounded-lg text-purple-800 font-black">Under Review</div>
              <div className="px-3 font-bold text-slate-300">➔</div>
              <div className="flex-1 text-center bg-blue-50/60 border-2 border-blue-500 py-2.5 rounded-lg text-blue-800 font-black">Completed</div>
              <div className="px-3 font-bold text-slate-300">➔</div>
              <div className="flex-1 text-center bg-slate-100 border border-slate-200 py-2.5 rounded-lg text-slate-400">Archived Repos</div>
            </div>
          </div>

          {/* ACTIVE CHALLENGES BENTO GRID */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 px-1">Active Corporate Challenges Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {challenges.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                <div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden border-2" style={{ borderColor: gamificationOrange }}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-3xl select-none">{item.icon}</span>
                      <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded border ${item.status === 'Active' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>{item.status}</span>
                    </div>
                    <h4 className="font-black text-slate-900 tracking-tight text-lg mb-1">{item.title}</h4>
                    <div className="text-xs font-bold text-slate-500 space-y-1 mt-2">
                      <p>Reward Matrix: <span className="text-slate-950 font-black">XP: {item.xp} • {item.difficulty}</span></p>
                      <p>Time Constraints: <span className="text-slate-950 font-black">Deadline {item.deadline}</span></p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleJoin(item.id)} className="mt-6 w-full py-2 rounded-xl text-xs font-black tracking-wide text-white transition-all uppercase hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: joinedTrack[item.id] ? '#334155' : gamificationOrange }}>
                    {joinedTrack[item.id] ? '✓ Active Participant' : 'Join Challenge'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* LOWER TWO-PANEL COMPACT PREVIEW DISPLAY SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-slate-300 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black tracking-tight text-slate-950 mb-4 flex items-center gap-2">🌱 Badge Gallery Ledger</h3>
              <div className="grid grid-cols-2 gap-3">
                {INITIAL_BADGES.slice(0, 4).map((b) => (
                  <div key={b.id} className="bg-amber-50/60 p-3 rounded-xl flex items-center space-x-3 border" style={{ borderColor: 'rgba(212, 91, 37, 0.25)' }}>
                    <span className="text-xl select-none">{b.icon}</span>
                    <span className="text-xs font-black text-amber-900 tracking-tight leading-tight">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 bg-white border border-slate-300 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black tracking-tight text-slate-950 mb-4 flex items-center gap-2">🏆 Top Performers Leaderboard</h3>
              <div className="space-y-2 font-bold text-xs">
                {INITIAL_LEADERBOARD.slice(0, 3).map((l) => (
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
                {participation.filter(p => p.employee.toLowerCase().includes(searchTerm.toLowerCase()) || p.challenge.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors cursor-pointer" style={selectedRowId === row.id ? { backgroundColor: 'rgba(212, 91, 37, 0.06)' } : {}} onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)} className="rounded border-slate-400" style={{ color: gamificationOrange }} />
                    </td>
                    <td className="p-4 font-black text-slate-900">{row.employee}</td>
                    <td className="p-4 text-slate-800 font-black">{row.challenge}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{row.joinedDate}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300/60">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${row.progress}%`, backgroundColor: gamificationOrange }}></div>
                        </div>
                        <span className="font-mono font-black text-xs min-w-[32px] text-right">{row.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${row.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-300' : row.status === 'Pending Start' ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
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
                  <th className="p-4 w-8"></th>
                  <th className="p-4 w-16 text-center">Icon</th>
                  <th className="p-4">Badge Designation Title</th>
                  <th className="p-4">Unlocking Validation Criteria</th>
                  <th className="p-4 text-center">Tier Class</th>
                  <th className="p-4 text-right">Global Fleet Issuances</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-black font-semibold">
                {badges.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors cursor-pointer" style={selectedRowId === row.id ? { backgroundColor: 'rgba(212, 91, 37, 0.06)' } : {}} onClick={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)}>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id === selectedRowId ? null : row.id)} className="rounded border-slate-400" style={{ color: gamificationOrange }} />
                    </td>
                    <td className="p-4 text-center text-2xl select-none">{row.icon}</td>
                    <td className="p-4 text-slate-900 font-black">{row.name}</td>
                    <td className="p-4 text-slate-500 text-xs font-medium max-w-sm">{row.criteria}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-black text-xs border uppercase ${row.tier === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-300' : row.tier === 'Silver' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-orange-50/50 text-orange-800 border-orange-200'}`}>{row.tier}</span>
                    </td>
                    <td className="p-4 text-right font-mono font-black text-slate-950">{row.unlockedCount} Users</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoGlowEffect>
      )}

      {/* ================= VIEW 4: REWARDS STORE ================= */}
      {activeSubTab === 'Rewards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {rewards.filter(r => r.product.toLowerCase().includes(searchTerm.toLowerCase())).map((reward) => (
              <div key={reward.id} className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all hover:border-slate-400">
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1">{reward.category}</span>
                  <h4 className="font-black text-slate-900 tracking-tight text-base leading-tight mb-2">{reward.product}</h4>
                  <p className="text-xs text-slate-500 font-bold">Remaining Allocations: <span className="text-black font-black">{reward.stock} units</span></p>
                </div>
                <button onClick={() => alert(`Processing redemption execution sequence for point metric payload: ${reward.cost}`)} className="mt-4 w-full py-1.5 rounded-lg text-xs font-black tracking-wide border text-white transition-all uppercase" style={{ backgroundColor: gamificationOrange, borderColor: gamificationOrange }}>
                  Redeem / {reward.cost}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VIEW 5: LEADERBOARD MATRIX ================= */}
      {activeSubTab === 'Leaderboard' && (
        <BentoGlowEffect glowColor="212, 91, 37" spotlightRadius={280} className="p-1">
          <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-300 text-left text-sm">
              <thead className="bg-slate-50 text-black font-black tracking-wide text-xs uppercase border-b border-slate-300">
                <tr>
                  <th className="p-4 w-20 text-center">Standing</th>
                  <th className="p-4">Corporate Entity Identity</th>
                  <th className="p-4">Organizational Node Type</th>
                  <th className="p-4 text-center">Verified Submissions Filed</th>
                  <th className="p-4 text-right">Aggregated Balance Accumulation</th>
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
                    <td className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wide">{row.type}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-700">{row.contributions} submissions</td>
                    <td className="p-4 text-right font-mono font-black text-base" style={{ color: gamificationOrange }}>{row.xp.toLocaleString()} XP</td>
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

    </div>
  );
}