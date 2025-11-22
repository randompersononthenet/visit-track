import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
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
      <section className="md:col-span-1 bg-slate-800/40 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Register Visitor</h2>
        <form className="space-y-3" onSubmit={onCreate}>
          <div className="grid grid-cols-1 gap-3">
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="ID number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Relation (e.g. Brother)" value={relation} onChange={(e) => setRelation(e.target.value)} />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button disabled={creating || !firstName || !lastName} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-3 py-2 rounded">
            {creating ? 'Creating...' : 'Create Visitor'}
          </button>
        </form>
        {createdQR && (
          <div className="mt-6">
            <div className="text-sm text-slate-300 mb-2">QR Code (print this):</div>
            <div className="bg-white inline-block p-3 rounded">
              <QRCodeSVG value={createdQR} size={160} />
            </div>
            <div className="mt-2 text-xs break-all text-slate-400">{createdQR}</div>
          </div>
        )}
      </section>

      <section className="md:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Visitors</h2>
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
                <th className="text-left px-3 py-2">Contact</th>
                <th className="text-left px-3 py-2">ID #</th>
                <th className="text-left px-3 py-2">QR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.fullName}</td>
                  <td className="px-3 py-2">{r.contact || '-'}</td>
                  <td className="px-3 py-2">{r.idNumber || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="bg-white inline-block p-1 rounded">
                      <QRCodeSVG value={r.qrCode} size={56} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-400" colSpan={5}>No records</td>
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
    </div>
  );
}
