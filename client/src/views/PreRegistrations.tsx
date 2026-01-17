import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export function PreRegistrations() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/prereg/pending');
      setRows(res.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load pre-registrations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Pre-Registrations (Pending)</h2>
        <button
          className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
          onClick={load}
        >
          Refresh
        </button>
      </div>
      {error && <div className="text-rose-600 dark:text-red-400 text-sm mb-2">{error}</div>}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-transparent">
        {loading ? (
          <div className="h-32 bg-slate-100 animate-pulse rounded dark:bg-slate-800/40" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">Full name</th>
                <th className="text-left px-3 py-2">Contact</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">Purpose</th>
                <th className="text-left px-3 py-2 hidden lg:table-cell">Intended date</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2">{r.full_name}</td>
                  <td className="px-3 py-2">{r.contact_number || '-'}</td>
                  <td className="px-3 py-2 hidden md:table-cell">{r.purpose_of_visit || '-'}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">{r.intended_visit_date || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                        title="Approve and Prefill"
                        onClick={async () => {
                          try {
                            const res = await api.post(`/api/prereg/${r.id}/approve`);
                            const prefill = res.data?.prefill;
                            if (prefill) {
                              navigate('/register', { state: { prefill } });
                            }
                          } catch (e: any) {
                            setError(e?.response?.data?.error || 'Approve failed');
                          }
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                        title="Reject"
                        onClick={async () => {
                          try {
                            await api.post(`/api/prereg/${r.id}/reject`);
                            await load();
                          } catch (e: any) {
                            setError(e?.response?.data?.error || 'Reject failed');
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-600 dark:text-slate-400" colSpan={5}>No pending records</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
