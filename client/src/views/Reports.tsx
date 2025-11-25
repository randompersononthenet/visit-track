import React from 'react';
import { useState } from 'react';
import { api } from '../lib/api';

export function Reports() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-3">
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            className="bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 text-left"
            onClick={() => downloadCsv('/api/reports/visitors.csv', 'visitors.csv')}
            disabled={downloading !== null}
          >
            {downloading === '/api/reports/visitors.csv' ? 'Downloading Visitors CSV...' : 'Download Visitors (CSV)'}
          </button>
          <button
            className="bg-slate-800 hover:bg-slate-700 rounded px-3 py-2 text-left"
            onClick={() => downloadCsv('/api/reports/personnel.csv', 'personnel.csv')}
            disabled={downloading !== null}
          >
            {downloading === '/api/reports/personnel.csv' ? 'Downloading Personnel CSV...' : 'Download Personnel (CSV)'}
          </button>
        </div>
        <div className="text-xs text-slate-400">
          PDF exports are planned in Phase 5; endpoints return 501 until PDFKit is wired.
        </div>
      </div>
    </div>
  );
}
