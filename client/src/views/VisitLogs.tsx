import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

export function VisitLogs() {
  const [subjectType, setSubjectType] = useState<'all' | 'visitor' | 'personnel'>('all');
  const [subjectId, setSubjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
      if (subjectId.trim() !== '') params.subjectId = subjectId.trim();
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();
      const res = await api.get('/api/visit-logs', { params });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, subjectType]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Visit Logs</h2>
      <div className="grid md:grid-cols-4 gap-3">
        <select className="bg-slate-900 border border-slate-700 rounded px-3 py-2" value={subjectType} onChange={(e) => { setPage(1); setSubjectType(e.target.value as any); }}>
          <option value="all">All subjects</option>
          <option value="visitor">Visitors</option>
          <option value="personnel">Personnel</option>
        </select>
        <input className="bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Subject ID (optional)" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
        <input className="bg-slate-900 border border-slate-700 rounded px-3 py-2" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input className="bg-slate-900 border border-slate-700 rounded px-3 py-2" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <div className="md:col-span-4 flex gap-2">
          <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={() => { setPage(1); load(); }}>Apply</button>
          <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={() => { setSubjectType('all'); setSubjectId(''); setDateFrom(''); setDateTo(''); setPage(1); load(); }}>Reset</button>
        </div>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2">Subject</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Time In</th>
              <th className="text-left px-3 py-2">Time Out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const type = r.visitorId ? 'visitor' : (r.personnelId ? 'personnel' : '—');
              const name = r.visitor?.fullName || r.personnel?.fullName || '—';
              return (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{name}</td>
                  <td className="px-3 py-2 capitalize">{type}</td>
                  <td className="px-3 py-2">{new Date(r.timeIn).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.timeOut ? new Date(r.timeOut).toLocaleString() : '-'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-400" colSpan={5}>{loading ? 'Loading...' : 'No logs'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm">
        <div className="text-slate-400">Page {page} of {totalPages} • {total} total</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} className="px-3 py-1 rounded bg-slate-800 disabled:opacity-60" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <button disabled={page >= totalPages} className="px-3 py-1 rounded bg-slate-800 disabled:opacity-60" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
}
