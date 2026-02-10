import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { hasRole } from '../lib/auth';
import { QRCodeSVG } from 'qrcode.react';
import { PrintableIdCard } from '../components/PrintableIdCard';
import { toPng } from 'html-to-image';

import { ArchivedVisitors } from './ArchivedVisitors';

export function RegisterExternal() {
  const [showArchived, setShowArchived] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [roleText, setRoleText] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdQR, setCreatedQR] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewQR, setPreviewQR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);
  const idCardRef = useRef<HTMLDivElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [capOpen, setCapOpen] = useState<null | 'create'>(null);
  const capVideoRef = useRef<HTMLVideoElement | null>(null);
  const capCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const capStreamRef = useRef<MediaStream | null>(null);
  const [capError, setCapError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  async function load() {
    const res = await api.get('/api/visitors', { params: { q, page, pageSize, type: 'special' } });
    setRows(res.data?.data || []);
    setTotal(res.data?.total || 0);
  }
  useEffect(() => { if (!showArchived) load(); }, [q, page, showArchived]);

  async function startCamera() {
    setCapError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      capStreamRef.current = stream;
      if (capVideoRef.current) {
        capVideoRef.current.srcObject = stream;
        await capVideoRef.current.play();
      }
    } catch (e: any) { setCapError(e?.message || 'Unable to access camera'); }
  }
  function stopCamera() {
    if (capStreamRef.current) { capStreamRef.current.getTracks().forEach((t) => t.stop()); capStreamRef.current = null; }
  }
  useEffect(() => { if (capOpen) startCamera(); return () => stopCamera(); }, [capOpen]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault(); setError(null); setCreating(true); setCreatedQR(null);
    try {
      if (!photoUrl) { setError('Photo is required'); return; }
      const payload: any = { firstName, lastName };
      if (middleName.trim() !== '') payload.middleName = middleName;
      if (contact.trim() !== '') payload.contact = contact;
      if (roleText.trim() !== '') payload.relation = roleText; // map Role to relation
      payload.type = 'special';
      payload.photoUrl = photoUrl;
      const res = await api.post('/api/visitors', payload);
      setCreatedQR(res.data?.qrCode || null);
      setFirstName(''); setMiddleName(''); setLastName(''); setContact(''); setRoleText(''); setPhotoUrl('');
      await load();
    } catch (err: any) { setError(err?.response?.data?.error || 'Failed to create external visitor'); }
    finally { setCreating(false); }
  }

  function imageBase(u: string) {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const base = isHttps ? window.location.origin : (((import.meta as any).env?.VITE_API_BASE) || 'http://localhost:4000');
    return /^https?:\/\//i.test(u) ? u : `${base}${u}`;
  }

  if (showArchived) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Archived External Visitors</h2>
          <button
            onClick={() => setShowArchived(false)}
            className="px-3 py-1.5 rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 text-sm font-medium"
          >
            ← Back to Active List
          </button>
        </div>
        <ArchivedVisitors defaultType="special" hideTypeFilter={true} />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <section className="md:col-span-1 bg-white border border-slate-200 rounded-lg p-4 dark:bg-slate-800/40 dark:border-slate-700">
        <h1 className="text-lg font-semibold mb-4">Officials/Doctors</h1>
        {hasRole(['admin', 'staff']) ? (
          <form className="space-y-3" onSubmit={onCreate}>
            <div className="grid grid-cols-1 gap-3">
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
              <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Contact (11 digits)" inputMode="numeric" maxLength={11} value={contact} onChange={(e) => setContact(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))} />
            <input className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Role (e.g., Court Official, Doctor)" maxLength={200} value={roleText} onChange={(e) => setRoleText(e.target.value)} />
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Photo (required)</div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded bg-slate-100 border border-slate-300 overflow-hidden">
                  {photoUrl ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <img src={imageBase(photoUrl)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">No photo</div>
                  )}
                  {capOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/70" onClick={() => setCapOpen(null)} />
                      <div className="relative bg-white border border-slate-200 rounded-lg p-4 z-10 w-[min(96vw,760px)] dark:bg-slate-900 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold">Capture Photo</div>
                          <button type="button" className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => setCapOpen(null)}>Close</button>
                        </div>
                        {capError && <div className="text-rose-600 dark:text-red-400 text-sm mb-2">{capError}</div>}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <video ref={capVideoRef} className="w-full rounded bg-black" muted playsInline />
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">Align face in center, then capture.</div>
                          </div>
                          <div>
                            <canvas ref={capCanvasRef} className="w-full rounded bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700" />
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">Preview (center-cropped)</div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <button type="button" className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => {
                            const video = capVideoRef.current; const canvas = capCanvasRef.current; if (!video || !canvas) return; const vw = (video as HTMLVideoElement).videoWidth; const vh = (video as HTMLVideoElement).videoHeight; if (!vw || !vh) return; const size = Math.min(vw, vh); const sx = (vw - size) / 2; const sy = (vh - size) / 2; const out = 512; canvas.width = out; canvas.height = out; const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.drawImage(video, sx, sy, size, size, 0, 0, out, out);
                          }}>Capture Frame</button>
                          <button type="button" className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white" onClick={async () => {
                            const canvas = capCanvasRef.current; if (!canvas) return; try { const dataUrl = canvas.toDataURL('image/jpeg', 0.9); const res = await api.post('/api/uploads/image', { dataUrl }); setPhotoUrl(res.data?.url || ''); setCapOpen(null); } catch (e: any) { setError(e?.response?.data?.error || 'Upload failed'); }
                          }}>Use Photo</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <label className="inline-flex items-center px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { const dataUrl = reader.result as string; try { const res = await api.post('/api/uploads/image', { dataUrl }); setPhotoUrl(res.data?.url || ''); } catch { } }; reader.readAsDataURL(file);
                  }} />
                  Upload
                </label>
                <button type="button" className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => setCapOpen('create')}>Capture</button>
              </div>
            </div>
            {error && <div className="text-rose-600 dark:text-red-400 text-sm">{error}</div>}
            <button disabled={creating || !firstName || !lastName || !photoUrl} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-3 py-2 rounded">
              {creating ? 'Creating...' : 'Create External Visitor'}
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
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">External Visitors</h2>
            {hasRole(['admin', 'staff']) && (
              <button
                onClick={() => setShowArchived(true)}
                className="text-xs px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/50 transition-colors font-medium shadow-sm"
              >
                View Archived
              </button>
            )}
          </div>
          <input className="bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 w-56 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="Search name..." value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        </div>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-transparent">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="text-left px-3 py-2 hidden md:table-cell">ID</th>
                <th className="text-left px-3 py-2">Full name</th>
                <th className="text-left px-3 py-2 hidden lg:table-cell">Role</th>
                <th className="text-left px-3 py-2 hidden lg:table-cell">QR</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2 hidden md:table-cell">{r.id}</td>
                  <td className="px-3 py-2">{r.fullName}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">{r.relation || '-'}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    <button type="button" onClick={() => setPreviewQR(r.qrCode)} className="bg-white inline-block p-1 rounded hover:ring-2 ring-indigo-400">
                      <QRCodeSVG value={r.qrCode} size={56} />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      {hasRole(['admin', 'staff']) && (
                        <button className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" title="Generate ID" aria-label="Generate ID" onClick={() => setPreviewQR(r.qrCode)}>
                          View QR
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
                <button className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={async () => { try { await navigator.clipboard.writeText(previewQR); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { } }}>{copied ? 'Copied' : 'Copy'}</button>
                <button className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { const svg = svgWrapRef.current?.querySelector('svg'); if (!svg) return; const data = new XMLSerializer().serializeToString(svg); const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `visitor-qr-${Date.now()}.svg`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }}>Download</button>
                <button className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { setPreviewQR(null); setCopied(false); }}>Close</button>
              </div>
            </div>
            <div ref={svgWrapRef} className="flex items-center justify-center bg-white rounded p-4">
              <QRCodeSVG value={previewQR} size={300} />
            </div>
          </div>
        </div>
      )}

      {createdQR && (
        <div className="fixed inset-0 z-50 hidden">
          <PrintableIdCard ref={idCardRef} type="visitor" fullName={[firstName, middleName, lastName].filter(Boolean).join(' ')} qrValue={createdQR} issuedAt={new Date().toISOString()} photoUrl={photoUrl || undefined} />
        </div>
      )}
    </div>
  );
}
