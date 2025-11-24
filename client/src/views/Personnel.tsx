import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';

export function Personnel() {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdQR, setCreatedQR] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewQR, setPreviewQR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  async function load() {
    const res = await api.get('/api/personnel', { params: { q, page, pageSize } });
    setRows(res.data?.data || []);
    setTotal(res.data?.total || 0);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    setCreatedQR(null);
    try {
      const payload: any = { firstName, lastName };
      if (middleName.trim() !== '') payload.middleName = middleName;
      if (roleTitle.trim() !== '') payload.roleTitle = roleTitle;
      const res = await api.post('/api/personnel', payload);
      setCreatedQR(res.data?.qrCode || null);
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setRoleTitle('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create personnel');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <section className="md:col-span-1 bg-slate-800/40 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Register Personnel</h2>
        <form className="space-y-3" onSubmit={onCreate}>
          <div className="grid grid-cols-1 gap-3">
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Role title (e.g. Gate Officer)" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button disabled={creating || !firstName || !lastName} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-3 py-2 rounded">
            {creating ? 'Creating...' : 'Create Personnel'}
          </button>
        </form>
        {createdQR && (
          <div className="mt-6">
            <div className="text-sm text-slate-300 mb-2">QR Code (print this):</div>
            <button type="button" onClick={() => setPreviewQR(createdQR)} className="bg-white inline-block p-3 rounded hover:ring-2 ring-indigo-400">
              <QRCodeSVG value={createdQR} size={160} />
            </button>
            <div className="mt-2 text-xs break-all text-slate-400">{createdQR}</div>
          </div>
        )}
      </section>

      <section className="md:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Personnel</h2>
          <input
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 w-56"
            placeholder="Search name..."
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Full name</th>
                <th className="text-left px-3 py-2">Role</th>
                <th className="text-left px-3 py-2">QR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.fullName}</td>
                  <td className="px-3 py-2">{r.roleTitle || '-'}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => setPreviewQR(r.qrCode)} className="bg-white inline-block p-1 rounded hover:ring-2 ring-indigo-400">
                      <QRCodeSVG value={r.qrCode} size={56} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-400" colSpan={4}>No records</td>
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
      </section>
      {previewQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setPreviewQR(null); setCopied(false); }} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-lg p-4 z-10 w-[min(92vw,520px)]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-300 break-all pr-4">{previewQR}</div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm rounded bg-slate-800 hover:bg-slate-700"
                  onClick={async () => { try { await navigator.clipboard.writeText(previewQR); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button className="px-3 py-1 text-sm rounded bg-slate-800 hover:bg-slate-700" onClick={() => { setPreviewQR(null); setCopied(false); }}>Close</button>
              </div>
            </div>
            <div className="flex items-center justify-center bg-white rounded p-4">
              <QRCodeSVG value={previewQR} size={300} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
