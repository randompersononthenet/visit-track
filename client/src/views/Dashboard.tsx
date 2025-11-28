import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function Dashboard() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/analytics/summary');
        setData(res.data);
        const [logsRes, trendRes] = await Promise.all([
          api.get('/api/visit-logs', { params: { page: 1, pageSize: 10 } }),
          api.get('/api/analytics/checkins-7d'),
        ]);
        setRecent(logsRes.data?.data || []);
        setTrend(trendRes.data?.days || []);
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
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 rounded p-4">
          <div className="font-semibold mb-3">Recent Activity</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-slate-300">
                <tr>
                  <th className="text-left py-2">Subject</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Time In</th>
                  <th className="text-left py-2">Time Out</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const type = r.visitorId ? 'Visitor' : (r.personnelId ? 'Personnel' : '');
                  const subject = r.visitor?.fullName || r.personnel?.fullName || '';
                  return (
                    <tr key={r.id} className="border-t border-slate-700">
                      <td className="py-2 pr-4">{subject}</td>
                      <td className="py-2 pr-4">{type}</td>
                      <td className="py-2 pr-4 text-slate-300">{r.timeIn ? new Date(r.timeIn).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-4 text-slate-400">{r.timeOut ? new Date(r.timeOut).toLocaleString() : '-'}</td>
                    </tr>
                  );
                })}
                {recent.length === 0 && (
                  <tr><td className="py-4 text-slate-400" colSpan={4}>No recent activity</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-slate-800/40 rounded p-4">
          <div className="font-semibold mb-3">Check-ins (Last 7 Days)</div>
          {/* Inline SVG bar chart */}
          <div className="h-48">
            {trend.length > 0 ? (
              <svg viewBox="0 0 320 160" className="w-full h-full">
                {(() => {
                  const max = Math.max(1, ...trend.map((d) => d.count));
                  const bw = 320 / (trend.length * 1.5);
                  return trend.map((d, i) => {
                    const h = (d.count / max) * 120;
                    const x = 10 + i * (bw * 1.5);
                    const y = 140 - h;
                    return (
                      <g key={d.date}>
                        <rect x={x} y={y} width={bw} height={h} fill="#6366f1" opacity="0.8" />
                        <text x={x + bw / 2} y={150} fontSize="10" textAnchor="middle" fill="#94a3b8">{d.date.slice(5)}</text>
                        <text x={x + bw / 2} y={y - 4} fontSize="10" textAnchor="middle" fill="#cbd5e1">{d.count}</text>
                      </g>
                    );
                  });
                })()}
                <line x1="0" y1="140" x2="320" y2="140" stroke="#475569" strokeWidth="1" />
              </svg>
            ) : (
              <div className="text-slate-400 text-sm">No data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
