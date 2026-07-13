import { useState, useEffect, useRef } from 'react';

// --- BACKEND CONNECTION ---
import api from '../api';

/**
 * ============================================================================
 * NotificationBell - THIS NEVER EXISTED BEFORE THIS FILE.
 * ============================================================================
 * Gap Fix: the backend has a complete, working live-notification system
 * (Server-Sent Events, firing for badge unlocks, CSR/Challenge approval
 * decisions, new compliance issues, and daily policy acknowledgement
 * reminders - exactly what the spec's "Notification System" requirement
 * lists), and `api.notifications.connect()` has existed in api.js this whole
 * time - but nothing in the frontend ever called it. Every one of those
 * backend events was firing into the void with nobody listening.
 *
 * This opens the real SSE connection once (on mount, inside Dashboard's
 * header, so it's alive for the whole authenticated session) and surfaces
 * incoming events as a small bell + unread badge + dropdown list, which is a
 * standard, recognizable pattern rather than inventing something novel.
 * ==========================================================================*/

const TYPE_ICONS = {
  BADGE_UNLOCKED: '🎖️',
  CSR_REVIEW: '🌱',
  CHALLENGE_REVIEW: '🎮',
  COMPLIANCE_ISSUE_RAISED: '⚠️',
  COMPLIANCE_OVERDUE: '🚨',
  POLICY_ACKNOWLEDGEMENT_REMINDER: '📜',
  REWARD_REDEEMED: '🎁',
  TRAINING_COMPLETED: '✅',
  CONNECTED: '🔌',
};

function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const es = api.notifications.connect(
      (payload) => {
        if (payload.type === 'CONNECTED') return; // internal handshake event, not a real notification
        setNotifications((prev) => [{ ...payload, id: `${Date.now()}-${Math.random()}` }, ...prev].slice(0, 20));
        setUnreadCount((prev) => prev + 1);
      },
      () => {
        // SSE connections auto-retry on their own (the backend sends a
        // `retry:` directive) - nothing to do here, just avoid an unhandled
        // error spamming the console on every transient drop.
      }
    );
    eventSourceRef.current = es;
    return () => es.close();
  }, []);

  function toggleOpen() {
    setIsOpen((prev) => !prev);
    if (!isOpen) setUnreadCount(0); // opening the dropdown marks everything read
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative w-8 h-8 rounded-xl bg-white/80 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-colors shadow-3xs"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl z-50">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">Live Notifications</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
              </span>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold text-center p-8">No notifications yet this session.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 flex items-start gap-2.5">
                    <span className="text-base shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-snug">{n.message}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}