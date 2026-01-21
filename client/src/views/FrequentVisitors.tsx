import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function FrequentVisitors() {
  const [minVisits, setMinVisits] = useState(1);
  const [maxVisits, setMaxVisits] = useState<number | ''>('');
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<{ visitorId: number; fullName: string; visits: number; daysVisited: number; lastVisit: string; avgDurationSeconds: number | null }>>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/api/analytics/frequent-visitors-all', {
          params: { minVisits, maxVisits: maxVisits === '' ? undefined : maxVisits, limit }
        });
        const data = (res as any)?.data?.data;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load frequent visitors');
      } finally {
        setLoading(false);
      }
    })();
  }, [minVisits, maxVisits, limit]);

  function formatDuration(sec: number | null | undefined): string {
    if (sec == null || isNaN(sec as any)) return '-';
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const mm = m.toString().padStart(2, '0');
    const sss = ss.toString().padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${sss}` : `${mm}:${sss}`;
  }

  const filtered = rows.filter(r => !q || r.fullName.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl md:text-3xl font-semibold mb-2 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Frequent Visitors
      </h2>

      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="min">Min visits</label>
          <input id="min" type="number" min={1} className="w-24 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={minVisits} onChange={(e)=> setMinVisits(Math.max(1, parseInt(e.target.value)||1))} />

          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="max">Max visits</label>
          <input id="max" type="number" min={minVisits} className="w-24 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={maxVisits} onChange={(e)=> {
            const v = e.target.value;
            if (v === '') setMaxVisits('');
            else setMaxVisits(Math.max(minVisits, parseInt(v)||minVisits));
          }} />

          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="limit">Show</label>
          <select id="limit" className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={limit} onChange={(e)=> setLimit(Math.max(10, Math.min(200, parseInt(e.target.value)||100)))}>
            {[25,50,100,150,200].map(n => (<option key={n} value={n}>{n}</option>))}
          </select>

          <div className="flex-1" />
          <input placeholder="Search name" className="w-60 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={q} onChange={(e)=> setQ(e.target.value)} />
        </div>

        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-24 bg-slate-100 animate-pulse rounded dark:bg-slate-800/40" />
          ) : filtered.length === 0 ? (
            <div className="text-slate-600 dark:text-slate-400 text-sm">No visitors match the selected filters.</div>
          ) : (
            <table className="min-w-full text-sm" aria-label="Frequent visitors full table">
              <thead className="text-slate-700 dark:text-slate-300 font-medium">
                <tr>
                  <th className="text-left py-1.5">Visitor</th>
                  <th className="text-left py-1.5">Total Visits</th>
                  <th className="text-left py-1.5">Distinct Days</th>
                  <th className="text-left py-1.5">Last Visit</th>
                  <th className="text-left py-1.5">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.visitorId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="py-1.5 pr-3">{row.fullName}</td>
                    <td className="py-1.5 pr-3">{row.visits}</td>
                    <td className="py-1.5 pr-3">{row.daysVisited}</td>
                    <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{row.lastVisit ? new Date(row.lastVisit).toLocaleString() : '-'}</td>
                    <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-400">{formatDuration(row.avgDurationSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
