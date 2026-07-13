/**
 * ============================================================================
 * QuickActions - THIS FILE NEVER EXISTED IN OUR CONVERSATION BEFORE.
 * ============================================================================
 * Simple navigational shortcuts - no data to fetch here, just real navigation
 * instead of static/dead buttons. Requires `onTabChange` to be passed down
 * from Dashboard.jsx (see the Dashboard.jsx update alongside this file).
 * Shortcuts differ by role: the admin set are all management actions that
 * would 403 for an employee, so employees get participation-focused
 * shortcuts instead.
 * ==========================================================================*/
const ADMIN_SHORTCUTS = [
  { icon: '🌍', label: 'Log Carbon Transaction', tag: 'ERP', tab: 'Environmental' },
  { icon: '🎯', label: 'Create Environmental Goal', tag: 'GOAL', tab: 'Environmental' },
  { icon: '🛡️', label: 'Generate Compliance Report', tag: 'COMP', tab: 'Reports' },
];

const EMPLOYEE_SHORTCUTS = [
  { icon: '🎮', label: 'Join a Challenge', tag: 'XP', tab: 'Gamification' },
  { icon: '🤝', label: 'Join a CSR Activity', tag: 'CSR', tab: 'Social' },
  { icon: '📜', label: 'Acknowledge Policies', tag: 'GOV', tab: 'Governance' },
];

export default function QuickActions({ onTabChange, userRole }) {
  const shortcuts = userRole === 'admin' ? ADMIN_SHORTCUTS : EMPLOYEE_SHORTCUTS;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs h-full">
      <h3 className="text-sm font-black text-slate-950">Shortcut Matrix</h3>
      <p className="text-xs text-slate-400 font-medium mb-4">Jump straight to common actions.</p>

      <div className="space-y-3">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            onClick={() => onTabChange?.(s.tab)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
          >
            <span className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">{s.icon}</span>
              <span className="text-sm font-bold text-slate-900">{s.label}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{s.tag}</span>
              <span className="text-slate-300">→</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}