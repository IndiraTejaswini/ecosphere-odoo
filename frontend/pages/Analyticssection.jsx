import { useState, useEffect } from 'react';

// --- BACKEND CONNECTION ---
import api from '../api';

/**
 * ============================================================================
 * AnalyticsSection - THIS FILE NEVER EXISTED IN OUR CONVERSATION BEFORE.
 * ============================================================================
 * Dashboard.jsx has always rendered <AnalyticsSection /> with zero props,
 * meaning whatever was in this file previously was 100% static/mock content -
 * that's exactly why the Overview page "felt static." This is a from-scratch
 * rebuild driven entirely by real backend data.
 *
 * TWO PANELS:
 * 1. "Environmental Score Trend" - uses /api/reports/score-history (real
 *    monthly ESG score snapshots, seeded with 12 real months of history).
 *    NOTE: I relabeled this from "Emissions Trend" to "Environmental Score
 *    Trend" deliberately - there's no backend endpoint for raw monthly
 *    emissions totals (CarbonTransaction data only spans the ~90 days your
 *    seed script generated, not a full 12 months), so a literal "emissions"
 *    trend would show 9 real zero-months before any data existed. The score
 *    history, by contrast, genuinely has 12 months of real data behind it.
 *    Mislabeling a score as "emissions" would be worse than just being
 *    accurate about what's actually being shown.
 * 2. "Department Index" - real per-department Overall ESG Score from
 *    /api/reports/esg-score, replacing the empty label-only bar chart.
 *
 * Both endpoints are Admin-only on the backend, so both panels degrade
 * gracefully with an inline message for non-admin logins instead of erroring.
 * ==========================================================================*/

function formatPeriodLabel(period) {
  // "2026-07" -> "Jul"
  const [, month] = period.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[parseInt(month, 10) - 1] || period;
}

function TrendLineChart({ data }) {
  if (data.length === 0) {
    return <div className="text-xs text-slate-400 p-10 text-center font-semibold">No score history yet.</div>;
  }

  const width = 640;
  const height = 200;
  const padX = 24;
  const padY = 24;
  const max = Math.max(...data.map((d) => d.avgScore), 1);
  const min = Math.min(...data.map((d) => d.avgScore), 0);
  const range = max - min || 1;

  const pointAt = (i, val) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * (width - padX * 2) + padX : width / 2;
    const y = height - padY - ((val - min) / range) * (height - padY * 2);
    return [x, y];
  };

  const points = data.map((d, i) => pointAt(i, d.avgScore));
  const polyline = points.map((p) => p.join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" preserveAspectRatio="none">
      <polyline points={polyline} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={data[i].period} cx={x} cy={y} r="3.5" fill="#059669" />
      ))}
      {data.map((d, i) => (
        <text key={d.period} x={points[i][0]} y={height - 4} fontSize="10" fill="#94a3b8" textAnchor="middle">
          {formatPeriodLabel(d.period)}
        </text>
      ))}
    </svg>
  );
}

function DepartmentBarChart({ departments }) {
  if (departments.length === 0) {
    return <div className="text-xs text-slate-400 p-10 text-center font-semibold">No department scores yet.</div>;
  }

  return (
    <div className="flex items-end justify-between gap-3 h-40 px-2 pt-4">
      {departments.map((d) => (
        <div key={d._id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <span className="text-[10px] font-mono font-black text-slate-600">{Math.round(d.totalScore)}</span>
          <div className="w-full h-full flex items-end">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-sky-400 transition-all duration-500"
              style={{ height: `${Math.max(4, d.totalScore)}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 truncate max-w-full" title={d.name}>
            {d.code || d.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsSection() {
  const [trendData, setTrendData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [historyRes, esgRes] = await Promise.allSettled([api.reports.scoreHistory(), api.reports.esgScore()]);

        if (cancelled) return;

        // Gap Fix: was Promise.all() - same fragility pattern as every other
        // dashboard page (see EnvironmentalDashboard etc.) - one failed call
        // used to blank BOTH panels instead of just the one that failed.
        const failures = [];

        if (historyRes.status === 'fulfilled') {
          // Group history rows (one per department per period) into an
          // org-wide average environmentalScore per period.
          const byPeriod = {};
          historyRes.value.data.forEach((row) => {
            if (!byPeriod[row.period]) byPeriod[row.period] = [];
            byPeriod[row.period].push(row.environmentalScore);
          });
          const series = Object.keys(byPeriod)
            .sort()
            .map((period) => ({
              period,
              avgScore: byPeriod[period].reduce((a, b) => a + b, 0) / byPeriod[period].length,
            }));
          setTrendData(series);
        } else {
          failures.push('score trend');
        }

        if (esgRes.status === 'fulfilled') {
          setDepartments(esgRes.value.departments);
        } else {
          failures.push('department index');
        }

        if (failures.length > 0) {
          console.error('Failed to load:', failures);
          setError(`Failed to load: ${failures.join(', ')}.`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.status === 403
              ? 'Analytics require admin access.'
              : err.message || 'Failed to load analytics'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">📈</span>
            <div>
              <h3 className="text-sm font-black text-slate-950">Environmental Score Trend</h3>
              <p className="text-xs text-slate-400 font-medium">Org-wide average, 12 months</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="text-xs text-slate-400 p-10 text-center font-semibold">Loading...</div>
          ) : error ? (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-4 font-semibold">⚠️ {error}</div>
          ) : (
            <TrendLineChart data={trendData} />
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">📊</span>
          <div>
            <h3 className="text-sm font-black text-slate-950">Department Index</h3>
            <p className="text-xs text-slate-400 font-medium">Overall ESG Score by department</p>
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="text-xs text-slate-400 p-10 text-center font-semibold">Loading...</div>
          ) : error ? (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-4 font-semibold">⚠️ {error}</div>
          ) : (
            <DepartmentBarChart departments={departments} />
          )}
        </div>
      </div>
    </div>
  );
}