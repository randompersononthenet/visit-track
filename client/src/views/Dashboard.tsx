import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function Dashboard() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([]);
  const [forecast, setForecast] = useState<{ window: number; series: { date: string; count: number }[]; movingAverage: { date: string; ma: number }[]; nextDayForecast: number | null; seriesPersonnel?: { date: string; count: number }[]; movingAveragePersonnel?: { date: string; ma: number }[]; nextDayForecastPersonnel?: number | null } | null>(null);
  const [showPersonnel, setShowPersonnel] = useState(false);
  const [windowSize, setWindowSize] = useState(7);
  const [loading, setLoading] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingForecast(true);
        setForecast(null);
        const forecastRes = await api.get('/api/analytics/visitor-forecast', { params: { window: windowSize, days: 30, includePersonnel: showPersonnel } });
        setForecast(forecastRes.data || null);
      } catch (e) {
        // don't block the rest of the dashboard if forecast fails
      } finally {
        setLoadingForecast(false);
      }
    })();
  }, [windowSize, showPersonnel]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z"/></svg>
        Dashboard
      </h2>
      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4" aria-label="Summary metrics">
        {[{label:'Total Visitors', value: data?.totals?.visitors},{label:'Total Personnel', value: data?.totals?.personnel},{label:'Today Check-ins', value: data?.today?.checkIns},{label:'Currently Inside', value: data?.inside?.current}].map((m, idx) => (
          <div key={idx} className="bg-slate-800/40 rounded p-4">
            <div className="text-slate-400 text-xs">{m.label}</div>
            <div className="text-2xl font-semibold">{loading ? <span className="inline-block w-12 h-6 bg-slate-700/60 animate-pulse rounded" /> : (m.value ?? '—')}</div>
          </div>
        ))}
      </div>
      <section>
      <div className="bg-slate-800/40 rounded p-4 lg:col-span-2 mt-6 overflow-hidden">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="font-semibold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/></svg>
            Visitor Forecast (Moving Average, {windowSize}-day)
          </div>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" className="accent-indigo-500" checked={showPersonnel} onChange={(e) => setShowPersonnel(e.target.checked)} />
              Show personnel trend
            </label>
            <label className="flex items-center gap-2 text-slate-300" htmlFor="window-size">Window</label>
            <select id="window-size" aria-label="Forecast window size" className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={windowSize} onChange={(e)=> setWindowSize(parseInt(e.target.value) || 7)}>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
              <option value={14}>14</option>
            </select>
            <div className="text-slate-300">Next day forecast: <span className="font-semibold">{loadingForecast ? '—' : (forecast?.nextDayForecast ?? '—')}</span></div>
          </div>
        </div>
        <div className="h-48">
          {loadingForecast ? (
            <div className="w-full h-full bg-slate-800/40 animate-pulse rounded" aria-busy="true" aria-label="Loading forecast" />
          ) : forecast && forecast.series?.length > 0 ? (
            <svg key={`${windowSize}-${showPersonnel}`} viewBox="0 0 640 200" className="w-full h-full">
              {(() => {
                const data = forecast.series.map((d, i) => ({ x: i, count: d.count, date: d.date }));
                const ma = forecast.movingAverage.map((d, i) => ({ x: i, ma: isNaN(d.ma as any) ? null : d.ma }));
                const pdata = (forecast.seriesPersonnel || []).map((d, i) => ({ x: i, count: d.count, date: d.date }));
                const pma = (forecast.movingAveragePersonnel || []).map((d, i) => ({ x: i, ma: isNaN(d.ma as any) ? null : d.ma }));
                const maxY = Math.max(1, ...data.map((d) => d.count), ...ma.map((m) => m.ma || 0), ...pdata.map((d) => d.count || 0), ...pma.map((m) => m.ma || 0));
                const pad = { left: 40, right: 10, top: 10, bottom: 30 };
                const width = 640 - pad.left - pad.right;
                const height = 200 - pad.top - pad.bottom;
                const xStep = width / Math.max(1, data.length - 1);
                const yScale = (v: number) => height - (v / maxY) * (height - 10);

                const linePath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad.left + p.x} ${pad.top + p.y}`).join(' ');

                  const countPts = data.map((d, i) => ({ x: i * xStep, y: yScale(d.count) }));
                  const maPts = ma.map((d, i) => ({ x: i * xStep, y: d.ma == null ? null : yScale(d.ma) }));
                  const maSegments: { x: number; y: number }[][] = [];
                  let cur: { x: number; y: number }[] = [];
                  maPts.forEach((p) => {
                    if (p.y == null) {
                      if (cur.length) { maSegments.push(cur); cur = []; }
                    } else {
                      cur.push({ x: p.x!, y: p.y });
                    }
                  });
                  if (cur.length) maSegments.push(cur);

                  const pCountPts = pdata.map((d, i) => ({ x: i * xStep, y: yScale(d.count) }));
                  const pmaPts = pma.map((d, i) => ({ x: i * xStep, y: d.ma == null ? null : yScale(d.ma) }));
                  const pmaSegments: { x: number; y: number }[][] = [];
                  let pcur: { x: number; y: number }[] = [];
                  pmaPts.forEach((p) => {
                    if (p.y == null) {
                      if (pcur.length) { pmaSegments.push(pcur); pcur = []; }
                    } else {
                      pcur.push({ x: p.x!, y: p.y });
                    }
                  });
                  if (pcur.length) pmaSegments.push(pcur);

                  return (
                    <g>
                      {/* axes */}
                      <line x1={pad.left} y1={pad.top + height} x2={pad.left + width} y2={pad.top + height} stroke="#475569" />
                      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + height} stroke="#475569" />
                      {/* counts line */}
                      <path d={linePath(countPts)} fill="none" stroke="#38bdf8" strokeWidth={2} />
                      {/* moving average segments */}
                      {maSegments.map((seg, idx) => (
                        <path key={idx} d={linePath(seg)} fill="none" stroke="#f59e0b" strokeWidth={2} />
                      ))}
                      {/* personnel series if enabled */}
                      {showPersonnel && pCountPts.length > 0 && (
                        <>
                          <path d={linePath(pCountPts)} fill="none" stroke="#22c55e" strokeWidth={2} />
                          {pmaSegments.map((seg, idx) => (
                            <path key={`p${idx}`} d={linePath(seg)} fill="none" stroke="#e11d48" strokeWidth={2} />
                          ))}
                        </>
                      )}
                      {/* x labels */}
                      {data.map((d, i) => (
                        <text key={d.date} x={pad.left + i * xStep} y={pad.top + height + 16} fontSize="10" textAnchor="middle" fill="#94a3b8">{d.date.slice(5)}</text>
                      ))}
                      {/* legend */}
                      <g>
                        <rect x={pad.left} y={pad.top} width="10" height="2" fill="#38bdf8" />
                        <text x={pad.left + 16} y={pad.top + 3} fontSize="10" fill="#cbd5e1">Visitors</text>
                        <rect x={pad.left + 90} y={pad.top} width="10" height="2" fill="#f59e0b" />
                        <text x={pad.left + 106} y={pad.top + 3} fontSize="10" fill="#cbd5e1">Visitors MA</text>
                        {showPersonnel && (
                          <>
                            <rect x={pad.left + 200} y={pad.top} width="10" height="2" fill="#22c55e" />
                            <text x={pad.left + 216} y={pad.top + 3} fontSize="10" fill="#cbd5e1">Personnel</text>
                            <rect x={pad.left + 290} y={pad.top} width="10" height="2" fill="#e11d48" />
                            <text x={pad.left + 306} y={pad.top + 3} fontSize="10" fill="#cbd5e1">Personnel MA</text>
                          </>
                        )}
                      </g>
                    </g>
                  );
                })()}
              </svg>
            ) : (
              <div className="text-slate-400 text-sm">No forecast data available for the selected window.</div>
            )}
          </div>
        </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 rounded p-4">
          <div className="font-semibold mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v4H4zM4 12h16v8H4z"/></svg>
            Recent Activity
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="h-32 bg-slate-800/40 animate-pulse rounded" aria-busy="true" aria-label="Loading recent activity" />
            ) : (
            <table className="min-w-full text-sm" aria-label="Recent activity table">
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
                  <tr><td className="py-6 text-slate-400" colSpan={4}>No recent activity to display.</td></tr>
                )}
              </tbody>
            </table>
            )}
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
      </section>
    </div>
  );
}
