import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { hasRole } from '../lib/auth';

export function AuditLogs() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, pageSize };
      if (q) params.q = q;
      if (action) params.action = action;
      if (entityType) params.entityType = entityType;
      if (actor) params.actor = actor;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.get('/api/audit-logs', { params });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (!hasRole(['admin'])) {
    return <div className="text-sm text-slate-600 dark:text-slate-400">You do not have access to this page.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v4H4zM4 12h16v8H4z"/></svg>
        Audit Trails
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Actor" value={actor} onChange={(e) => setActor(e.target.value)} />
        <div className="flex gap-2">
          <input type="date" className="flex-1 bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="flex-1 bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <select className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">All entities</option>
          <option value="user">user</option>
          <option value="visitor">visitor</option>
          <option value="personnel">personnel</option>
        </select>
        <select className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          <option value="create">create</option>
          <option value="update">update</option>
          <option value="delete">delete</option>
          <option value="reset_password">reset_password</option>
          <option value="disable">disable</option>
          <option value="enable">enable</option>
        </select>
        <div>
          <button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => { setPage(1); load(); }}>Apply</button>
        </div>
      </div>
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-transparent">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">Actor</th>
              <th className="text-left px-3 py-2">Action</th>
              <th className="text-left px-3 py-2">Entity</th>
              <th className="text-left px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">{r.actorUsername || r.actorId}</td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="px-3 py-2">{r.entityType}#{r.entityId ?? '-'}</td>
                <td className="px-3 py-2">
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">{r.details ? JSON.stringify(r.details, null, 2) : '-'}</pre>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600 dark:text-slate-400" colSpan={5}>{loading ? 'Loading…' : 'No audit logs'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
        <div className="text-sm text-slate-600 dark:text-slate-400">Page {page} / {totalPages}</div>
        <button className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </div>
  );
}
