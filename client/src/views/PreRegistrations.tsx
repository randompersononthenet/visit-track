import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export function PreRegistrations() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);

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

  async function openPreview(id: string) {
    setPreviewLoading(true);
    setPreview(null);
    setPreviewId(id);
    try {
      const res = await api.get(`/api/prereg/${id}`);
      setPreview(res.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load preview');
      setPreviewId(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Pre-Registrations</h1>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
            onClick={load}
            disabled={loading || bulkApproving}
          >
            Refresh
          </button>
          <button
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
            disabled={loading || bulkApproving || rows.length === 0}
            onClick={async () => {
              if (rows.length === 0) return;
              const ok = window.confirm(`Approve all ${rows.length} pending pre-registrations?`);
              if (!ok) return;
              setBulkApproving(true);
              setError(null);
              try {
                let failed = 0;
                for (const r of rows) {
                  try {
                    await api.post(`/api/prereg/${r.id}/approve`);
                  } catch {
                    failed++;
                  }
                }
                await load();
                if (failed > 0) {
                  setError(`${failed} record(s) failed to approve.`);
                }
              } catch (e: any) {
                setError(e?.response?.data?.error || 'Bulk approve failed');
              } finally {
                setBulkApproving(false);
              }
            }}
          >
            {bulkApproving ? 'Approving...' : 'Approve All'}
          </button>
        </div>
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
                <th className="text-left px-3 py-2 hidden md:table-cell">Relation</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2">{r.full_name}</td>
                  <td className="px-3 py-2">{r.contact_number || '-'}</td>
                  <td className="px-3 py-2 hidden md:table-cell">{r.relation || r.purpose_of_visit || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                        title="Preview"
                        onClick={() => openPreview(r.id)}
                      >
                        Preview
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                        title="Approve and Create Visitor"
                        onClick={async () => {
                          try {
                            await api.post(`/api/prereg/${r.id}/approve`);
                            await load();
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
      {previewId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold">Pre-Registration Preview</h3>
              <button onClick={() => { setPreviewId(null); setPreview(null); }} className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">Close</button>
            </div>
            <div className="p-4 grid md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="aspect-square w-full bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden">
                  {previewLoading ? (
                    <div className="animate-pulse h-32 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  ) : (preview?.photo_preview_url || preview?.photo_url) ? (
                    <img
                      src={(() => {
                        const u = preview.photo_preview_url || preview.photo_url;
                        if (!u) return '';
                        const base = (typeof window !== 'undefined' && window.location.protocol === 'https:')
                          ? window.location.origin
                          : (((import.meta as any).env?.VITE_API_BASE) || 'http://localhost:4000');
                        return /^https?:\/\//i.test(u) ? u : `${base}${u}`;
                      })()}
                      alt="Profile"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-slate-500 text-sm">No photo</div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 grid gap-2">
                {previewLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  </div>
                ) : preview ? (
                  <>
                    <div><span className="text-slate-500">Name:</span> {preview.full_name}</div>
                    <div><span className="text-slate-500">Contact:</span> {preview.contact_number || '-'}</div>
                    <div><span className="text-slate-500">Relation:</span> {preview.relation || '-'}</div>
                    <div><span className="text-slate-500">ID number:</span> {preview.id_number || '-'}</div>
                    <div className="text-xs text-slate-500">Submitted: {new Date(preview.created_at).toLocaleString()}</div>
                  </>
                ) : (
                  <div className="text-rose-600 text-sm">Failed to load preview</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
              <button
                className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={!preview || previewLoading}
                onClick={async () => {
                  if (!preview) return;
                  try {
                    await api.post(`/api/prereg/${preview.id}/approve`);
                    setPreviewId(null);
                    setPreview(null);
                    await load();
                  } catch (e: any) {
                    setError(e?.response?.data?.error || 'Approve failed');
                  }
                }}
              >
                Approve
              </button>
              <button
                className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                onClick={() => { setPreviewId(null); setPreview(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
