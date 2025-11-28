import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { hasRole } from '../lib/auth';
import { QRCodeSVG } from 'qrcode.react';

export function Register() {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [relation, setRelation] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdQR, setCreatedQR] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewQR, setPreviewQR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);

  const [editing, setEditing] = useState<any | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editMiddle, setEditMiddle] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editRelation, setEditRelation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  async function load() {
    const res = await api.get('/api/visitors', { params: { q, page, pageSize } });
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
      if (contact.trim() !== '') payload.contact = contact;
      if (idNumber.trim() !== '') payload.idNumber = idNumber;
      if (relation.trim() !== '') payload.relation = relation;
      const res = await api.post('/api/visitors', payload);
      setCreatedQR(res.data?.qrCode || null);
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setContact('');
      setIdNumber('');
      setRelation('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create visitor');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <section className="md:col-span-1 bg-white border border-slate-200 rounded-lg p-4 dark:bg-slate-800/40 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-4">Register Visitor</h2>
        {hasRole(['admin','staff']) ? (
        <form className="space-y-3" onSubmit={onCreate}>
          <div className="grid grid-cols-1 gap-3">
            <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="ID number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Relation (e.g. Brother)" value={relation} onChange={(e) => setRelation(e.target.value)} />
          {error && <div className="text-rose-600 dark:text-red-400 text-sm">{error}</div>}
          <button disabled={creating || !firstName || !lastName} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-3 py-2 rounded">
            {creating ? 'Creating...' : 'Create Visitor'}
          </button>
        </form>
        ) : (
          <div className="text-sm text-slate-600 dark:text-slate-400">You don't have permission to create visitors.</div>
        )}
        {createdQR && (
          <div className="mt-6">
            <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">QR Code (print this):</div>
            <button type="button" onClick={() => setPreviewQR(createdQR)} className="bg-white inline-block p-3 rounded hover:ring-2 ring-indigo-400">
              <QRCodeSVG value={createdQR} size={160} />
            </button>
            <div className="mt-2 text-xs break-all text-slate-600 dark:text-slate-400">{createdQR}</div>
          </div>
        )}
      </section>

      <section className="md:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Visitors</h2>
          <input
            className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 w-56 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            placeholder="Search name..."
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-transparent">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Full name</th>
                <th className="text-left px-3 py-2">Contact</th>
                <th className="text-left px-3 py-2">ID #</th>
                <th className="text-left px-3 py-2">QR</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.fullName}</td>
                  <td className="px-3 py-2">{r.contact || '-'}</td>
                  <td className="px-3 py-2">{r.idNumber || '-'}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => setPreviewQR(r.qrCode)} className="bg-white inline-block p-1 rounded hover:ring-2 ring-indigo-400">
                      <QRCodeSVG value={r.qrCode} size={56} />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {hasRole(['admin','staff']) && (
                      <button
                        className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                        onClick={() => {
                          setEditing(r);
                          setEditFirst(r.firstName || '');
                          setEditMiddle(r.middleName || '');
                          setEditLast(r.lastName || '');
                          setEditContact(r.contact || '');
                          setEditIdNumber(r.idNumber || '');
                          setEditRelation(r.relation || '');
                        }}
                      >
                        Edit
                      </button>
                      )}
                      {hasRole(['admin','staff']) && (
                      <button
                        className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                        onClick={async () => {
                          if (!confirm('Delete this visitor?')) return;
                          try {
                            await api.delete(`/api/visitors/${r.id}`);
                            await load();
                          } catch {}
                        }}
                      >
                        Delete
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-600 dark:text-slate-400" colSpan={5}>No records</td>
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
      </section>
      {previewQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setPreviewQR(null); setCopied(false); }} />
          <div className="relative bg-white border border-slate-200 rounded-lg p-4 z-10 w-[min(92vw,520px)] dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-700 dark:text-slate-300 break-all pr-4">{previewQR}</div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                  onClick={async () => { try { await navigator.clipboard.writeText(previewQR); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                  onClick={() => {
                    const svg = svgWrapRef.current?.querySelector('svg');
                    if (!svg) return;
                    const data = new XMLSerializer().serializeToString(svg);
                    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `visitor-qr-${Date.now()}.svg`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </button>
                <button
                  className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                  onClick={() => {
                    const svg = svgWrapRef.current?.querySelector('svg');
                    if (!svg) return;
                    const data = new XMLSerializer().serializeToString(svg);
                    const win = window.open('', 'print-qr', 'width=420,height=420');
                    if (!win) return;
                    win.document.write(`<!doctype html><html><head><title>Print QR</title><style>html,body{height:100%}body{margin:0;display:flex;align-items:center;justify-content:center}</style></head><body>${data}</body></html>`);
                    win.document.close();
                    win.focus();
                    setTimeout(() => { try { win.print(); win.close(); } catch {} }, 300);
                  }}
                >
                  Print
                </button>
                <button className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { setPreviewQR(null); setCopied(false); }}>Close</button>
              </div>
            </div>
            <div ref={svgWrapRef} className="flex items-center justify-center bg-white rounded p-4">
              <QRCodeSVG value={previewQR} size={300} />
            </div>
          </div>
        </div>
      )}

      {editing && hasRole(['admin','staff']) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => { if (!savingEdit) setEditing(null); }} />
          <div className="relative bg-white border border-slate-200 rounded-lg p-4 z-10 w-[min(92vw,560px)] dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Edit Visitor</div>
              <button className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { if (!savingEdit) setEditing(null); }}>Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="First name" value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Middle name (optional)" value={editMiddle} onChange={(e) => setEditMiddle(e.target.value)} />
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Last name" value={editLast} onChange={(e) => setEditLast(e.target.value)} />
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Contact" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="ID number" value={editIdNumber} onChange={(e) => setEditIdNumber(e.target.value)} />
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Relation" value={editRelation} onChange={(e) => setEditRelation(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { if (!savingEdit) setEditing(null); }}>Cancel</button>
              <button
                className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
                disabled={savingEdit || !editFirst || !editLast}
                onClick={async () => {
                  setSavingEdit(true);
                  try {
                    const payload: any = { firstName: editFirst, lastName: editLast };
                    if (editMiddle.trim() !== '') payload.middleName = editMiddle;
                    if (editContact.trim() !== '') payload.contact = editContact; else payload.contact = null;
                    if (editIdNumber.trim() !== '') payload.idNumber = editIdNumber; else payload.idNumber = null;
                    if (editRelation.trim() !== '') payload.relation = editRelation; else payload.relation = null;
                    await api.patch(`/api/visitors/${editing.id}`, payload);
                    await load();
                    setEditing(null);
                  } catch {}
                  finally { setSavingEdit(false); }
                }}
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
