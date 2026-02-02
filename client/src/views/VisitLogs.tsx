import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

export function VisitLogs() {
  function todayLocalISODate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const [subjectType, setSubjectType] = useState<'all' | 'visitor' | 'personnel'>('all');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState(todayLocalISODate());
  const [dateTo, setDateTo] = useState(todayLocalISODate());
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, pageSize };
      if (subjectType !== 'all') params.subjectType = subjectType;
      if (q.trim() !== '') params.q = q.trim();
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        params.dateFrom = from.toISOString();
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`);
        params.dateTo = to.toISOString();
      }
      const res = await api.get('/api/visit-logs', { params });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  // Auto-apply filters. Debounce name search to reduce requests.
  useEffect(() => {
    const t = setTimeout(() => { load(); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, subjectType, dateFrom, dateTo, q]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Visit Logs</h1>
      <div className="grid md:grid-cols-4 gap-3">
        <select className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={subjectType} onChange={(e) => { setPage(1); setSubjectType(e.target.value as any); }}>
          <option value="all">All subjects</option>
          <option value="visitor">Visitors</option>
          <option value="personnel">Personnel</option>
        </select>
        <input className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Name (optional)" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        <input className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
        <input className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
      </div>
      {error && <div className="text-rose-600 dark:text-red-400 text-sm">{error}</div>}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-transparent">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="text-left px-3 py-2 hidden md:table-cell">ID</th>
              <th className="text-left px-3 py-2">Subject</th>
              <th className="text-left px-3 py-2 hidden sm:table-cell">Type</th>
              <th className="text-left px-3 py-2">Time In</th>
              <th className="text-left px-3 py-2 hidden md:table-cell">Time Out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const type = r.visitorId ? 'visitor' : (r.personnelId ? 'personnel' : '—');
              const name = r.visitor?.fullName || r.personnel?.fullName || '—';
              return (
                <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2 hidden md:table-cell">{r.id}</td>
                  <td className="px-3 py-2">{name}</td>
                  <td className="px-3 py-2 capitalize hidden sm:table-cell">{type}</td>
                  <td className="px-3 py-2">{new Date(r.timeIn).toLocaleString()}</td>
                  <td className="px-3 py-2 hidden md:table-cell">{r.timeOut ? new Date(r.timeOut).toLocaleString() : '-'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600 dark:text-slate-400" colSpan={5}>{loading ? 'Loading...' : 'No logs'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm">
        <div className="text-slate-600 dark:text-slate-400">Page {page} of {totalPages} • {total} total</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 disabled:opacity-60 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <button disabled={page >= totalPages} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 disabled:opacity-60 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
}
