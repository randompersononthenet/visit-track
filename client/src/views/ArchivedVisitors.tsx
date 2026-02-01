import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { hasRole } from '../lib/auth';

export function ArchivedVisitors() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);
  const [type, setType] = useState<'all'|'regular'|'special'>('all');

  async function load() {
    const params: any = { q, page, pageSize, includeArchived: 1 };
    if (type !== 'all') params.type = type;
    const res = await api.get('/api/visitors', { params });
    // Only show archived items
    const list = (res.data?.data || []).filter((r: any) => !!r.archivedAt);
    setRows(list);
    setTotal(res.data?.total || 0);
  }

  useEffect(() => { load(); }, [q, page, type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Archived Visitors</h1>
        <div className="flex gap-2">
          <select className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={type} onChange={(e)=> setType(e.target.value as any)}>
            <option value="all">All types</option>
            <option value="regular">Regular</option>
            <option value="special">Special</option>
          </select>
          <input className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 w-56 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Search name..." value={q} onChange={(e)=> { setPage(1); setQ(e.target.value); }} />
        </div>
      </div>
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-transparent">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="text-left px-3 py-2 hidden md:table-cell">ID</th>
              <th className="text-left px-3 py-2">Full name</th>
              <th className="text-left px-3 py-2 hidden lg:table-cell">Type</th>
              <th className="text-left px-3 py-2 hidden xl:table-cell">Contact</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-3 py-2 hidden md:table-cell">{r.id}</td>
                <td className="px-3 py-2">{r.fullName}</td>
                <td className="px-3 py-2 hidden lg:table-cell">{r.type || 'regular'}</td>
                <td className="px-3 py-2 hidden xl:table-cell">{r.contact || '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1.5">
                    <button className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white" title="Restore" onClick={async () => { try { await api.patch(`/api/visitors/${r.id}/restore`); await load(); } catch {} }}>Restore</button>
                    {hasRole(['admin']) && (
                      <button className="p-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white" title="Delete" onClick={async () => { if (!confirm('PERMANENTLY delete this visitor and related incidents? This cannot be undone.')) return; try { await api.delete(`/api/visitors/${r.id}/hard`); await load(); } catch {} }}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600 dark:text-slate-400" colSpan={5}>No archived records</td>
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
