import React from 'react';
import { useState } from 'react';
import { api } from '../lib/api';

export function Scan() {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState<'checkin' | 'checkout' | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doScan(action: 'checkin' | 'checkout') {
    setLoading(action);
    setError(null);
    setResult(null);
    try {
      const res = await api.post('/api/scan', { qrCode, action });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Scan failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Scan</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <section className="md:col-span-1 bg-slate-800/40 rounded-lg p-4">
          <div className="space-y-3">
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
              placeholder="Paste or scan QR code value"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
            />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded disabled:opacity-60"
                disabled={!qrCode || loading !== null}
                onClick={() => doScan('checkin')}
              >
                {loading === 'checkin' ? 'Checking in...' : 'Check-in'}
              </button>
              <button
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded disabled:opacity-60"
                disabled={!qrCode || loading !== null}
                onClick={() => doScan('checkout')}
              >
                {loading === 'checkout' ? 'Checking out...' : 'Check-out'}
              </button>
            </div>
          </div>
        </section>

        <section className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-2">Result</h3>
          {!result && !error && <div className="text-slate-400 text-sm">No scan yet.</div>}
          {result && (
            <div className="bg-slate-800/40 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-400">Event:</span> {result.event}</div>
                <div><span className="text-slate-400">Timestamp:</span> {new Date(result.at).toLocaleString()}</div>
                <div><span className="text-slate-400">Subject:</span> {result.subjectType}</div>
                <div><span className="text-slate-400">Log ID:</span> {result.logId}</div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
