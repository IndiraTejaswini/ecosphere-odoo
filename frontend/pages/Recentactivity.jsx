import { useState, useEffect } from 'react';

// --- BACKEND CONNECTION ---
import api from '../api';

/**
 * ============================================================================
 * RecentActivity - THIS FILE NEVER EXISTED IN OUR CONVERSATION BEFORE.
 * ============================================================================
 * There's no single "activity feed" endpoint on the backend, so this builds
 * one client-side by pulling recent records from 4 existing endpoints and
 * merging them into one feed sorted by recency:
 *   - Recent Carbon Transactions
 *   - Recently-raised OPEN Compliance Issues (admin-only)
 *   - Recently-approved Challenge participations
 *   - Recently-approved CSR participations
 * Each source is fetched independently (Promise.allSettled) so an admin-only
 * source failing for a non-admin login doesn't take down the whole feed -
 * it just contributes fewer entries.
 * ==========================================================================*/

function timeAgo(dateString) {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentActivity() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [ctRes, ciRes, cpRes, epRes] = await Promise.allSettled([
        api.carbonTransactions.list({ limit: 5 }),
        api.governance.listComplianceIssues({ status: 'Open', limit: 5 }),
        api.challenges.listParticipations({ limit: 10 }),
        api.csr.listParticipations({ limit: 10 }),
      ]);

      const items = [];

      if (ctRes.status === 'fulfilled') {
        ctRes.value.data.forEach((tx) => {
          items.push({
            id: `ct-${tx._id}`,
            icon: '⚙️',
            iconBg: 'bg-slate-100 text-slate-500',
            title: `Carbon transaction logged: ${tx.department?.name || 'Unknown dept'} · ${tx.source}`,
            subtitle: `${tx.calculatedCO2e?.toFixed(1) ?? '—'} kg CO₂e${tx.anomalyFlag ? ' · flagged as anomaly' : ''}`,
            timestamp: tx.timestamp,
          });
        });
      }

      if (ciRes.status === 'fulfilled') {
        ciRes.value.data.forEach((ci) => {
          items.push({
            id: `ci-${ci._id}`,
            icon: '⚠️',
            iconBg: 'bg-amber-50 text-amber-600',
            title: `Compliance issue flagged in ${ci.department?.name || 'operations'}`,
            subtitle: ci.description,
            timestamp: ci.createdAt,
          });
        });
      }

      if (cpRes.status === 'fulfilled') {
        cpRes.value.data
          .filter((p) => p.approvalStatus === 'Approved')
          .forEach((p) => {
            items.push({
              id: `cp-${p._id}`,
              icon: '✅',
              iconBg: 'bg-emerald-50 text-emerald-600',
              title: `${p.employee?.name || 'Someone'} completed "${p.challenge?.title || 'a challenge'}"`,
              subtitle: `+${p.xpAwarded || 0} XP awarded automatically`,
              timestamp: p.updatedAt || p.createdAt,
            });
          });
      }

      if (epRes.status === 'fulfilled') {
        epRes.value.data
          .filter((p) => p.approvalStatus === 'Approved')
          .forEach((p) => {
            items.push({
              id: `ep-${p._id}`,
              icon: '🌱',
              iconBg: 'bg-emerald-50 text-emerald-600',
              title: `${p.employee?.name || 'Someone'} completed "${p.activity?.title || 'a CSR activity'}"`,
              subtitle: `+${p.pointsEarned || 0} points awarded`,
              timestamp: p.completionDate || p.updatedAt,
            });
          });
      }

      items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      if (!cancelled) {
        setFeed(items.slice(0, 8));
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-slate-950">Live Operational Log</h3>
          <p className="text-xs text-slate-400 font-medium">Real activity, pulled from the transaction ledger</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {loading ? (
          <div className="text-xs text-slate-400 p-8 text-center font-semibold">Loading activity...</div>
        ) : feed.length === 0 ? (
          <div className="text-xs text-slate-400 p-8 text-center font-semibold">No recent activity yet.</div>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${item.iconBg}`}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                {item.subtitle && <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>}
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0 pt-1">{timeAgo(item.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}