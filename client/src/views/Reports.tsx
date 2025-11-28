import React from 'react';
import { useMemo, useState } from 'react';
import { api } from '../lib/api';

export function Reports() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [subjectType, setSubjectType] = useState<'all' | 'visitor' | 'personnel'>('all');
  const [subjectId, setSubjectId] = useState('');

  const dateQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', new Date(dateFrom).toISOString());
    if (dateTo) params.set('dateTo', new Date(dateTo).toISOString());
    return params.toString();
  }, [dateFrom, dateTo]);

  async function downloadCsv(path: string, filename: string) {
    setError(null);
    setDownloading(path);
    try {
      const res = await api.get(path, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Download failed');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Reports</h2>
      <div className="space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <input className="bg-slate-900 border border-slate-700 rounded px-3 py-2" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input className="bg-slate-900 border border-slate-700 rounded px-3 py-2" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <select className="bg-slate-900 border border-slate-700 rounded px-3 py-2" value={subjectType} onChange={(e) => setSubjectType(e.target.value as any)}>
            <option value="all">All subjects</option>
            <option value="visitor">Visitors</option>
            <option value="personnel">Personnel</option>
          </select>
          <input className="bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Subject ID (optional)" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            className="bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 text-left"
            onClick={() => {
              const qs = dateQuery ? `?${dateQuery}` : '';
              downloadCsv(`/api/reports/visitors.csv${qs}`, 'visitors.csv');
            }}
            disabled={downloading !== null}
          >
            {downloading === '/api/reports/visitors.csv' ? 'Downloading Visitors CSV...' : 'Download Visitors (CSV)'}
          </button>
          <button
            className="bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 text-left"
            onClick={() => {
              const qs = dateQuery ? `?${dateQuery}` : '';
              downloadCsv(`/api/reports/personnel.csv${qs}`, 'personnel.csv');
            }}
            disabled={downloading !== null}
          >
            {downloading === '/api/reports/personnel.csv' ? 'Downloading Personnel CSV...' : 'Download Personnel (CSV)'}
          </button>
          <button
            className="bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 text-left sm:col-span-2"
            onClick={() => {
              const params = new URLSearchParams();
              if (dateFrom) params.set('dateFrom', new Date(dateFrom).toISOString());
              if (dateTo) params.set('dateTo', new Date(dateTo).toISOString());
              if (subjectType !== 'all') params.set('subjectType', subjectType);
              if (subjectId.trim() !== '') params.set('subjectId', subjectId.trim());
              const qs = params.toString();
              downloadCsv(`/api/reports/visit-logs.csv${qs ? `?${qs}` : ''}`, 'visit-logs.csv');
            }}
            disabled={downloading !== null}
          >
            {downloading === '/api/reports/visit-logs.csv' ? 'Downloading Visit Logs CSV...' : 'Download Visit Logs (CSV)'}
          </button>
        </div>
        <div className="text-xs text-slate-400">
          PDF exports are planned in Phase 5; endpoints return 501 until PDFKit is wired.
        </div>
      </div>
    </div>
  );
}
