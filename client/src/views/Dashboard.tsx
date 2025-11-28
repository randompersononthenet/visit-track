import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function Dashboard() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/analytics/summary');
        setData(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load summary');
      }
    })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/40 rounded p-4">
          <div className="text-slate-400 text-xs">Total Visitors</div>
          <div className="text-2xl font-semibold">{data?.totals?.visitors ?? '—'}</div>
        </div>
        <div className="bg-slate-800/40 rounded p-4">
          <div className="text-slate-400 text-xs">Total Personnel</div>
          <div className="text-2xl font-semibold">{data?.totals?.personnel ?? '—'}</div>
        </div>
        <div className="bg-slate-800/40 rounded p-4">
          <div className="text-slate-400 text-xs">Today Check-ins</div>
          <div className="text-2xl font-semibold">{data?.today?.checkIns ?? '—'}</div>
        </div>
        <div className="bg-slate-800/40 rounded p-4">
          <div className="text-slate-400 text-xs">Currently Inside</div>
          <div className="text-2xl font-semibold">{data?.inside?.current ?? '—'}</div>
        </div>
      </div>
    </div>
  );
}
