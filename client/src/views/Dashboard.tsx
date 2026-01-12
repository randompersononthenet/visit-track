import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { toPng } from 'html-to-image';

export function Dashboard() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([]);
  const [forecast, setForecast] = useState<{ window: number; algo?: 'ma'|'hw'; seasonLen?: number; series: { date: string; count: number }[]; movingAverage: { date: string; ma: number }[]; smoothed?: { date: string; value: number }[]; metrics?: { mae: number; rmse: number; mape?: number; ci?: { lo: number; hi: number } }; nextDayForecast: number | null; seriesPersonnel?: { date: string; count: number }[]; movingAveragePersonnel?: { date: string; ma: number }[]; nextDayForecastPersonnel?: number | null } | null>(null);
  const [showPersonnel, setShowPersonnel] = useState(false);
  const [windowSize, setWindowSize] = useState(7);
  const [loading, setLoading] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showVisitors, setShowVisitors] = useState(true);
  const [showVisitorsMA, setShowVisitorsMA] = useState(true);
  const [showPersonnelSeries, setShowPersonnelSeries] = useState(true);
  const [showPersonnelMA, setShowPersonnelMA] = useState(true);
  const [showSeasonal, setShowSeasonal] = useState(true);
  const [algo, setAlgo] = useState<'ma'|'hw'>('ma');
  const [seasonLen, setSeasonLen] = useState(7);
  const [overlayMA, setOverlayMA] = useState(true);
  const [alpha, setAlpha] = useState(0.3);
  const [beta, setBeta] = useState(0.1);
  const [gamma, setGamma] = useState(0.3);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const forecastSvgRef = useRef<SVGSVGElement | null>(null);
  const [heatmap, setHeatmap] = useState<{ days: number; grid: number[][] } | null>(null);
  const [trendWeek, setTrendWeek] = useState<{ granularity: string; series: { label: string; count: number }[] } | null>(null);
  const [trendMonth, setTrendMonth] = useState<{ granularity: string; series: { label: string; count: number }[] } | null>(null);
  const [heatmapDays, setHeatmapDays] = useState(30);
  const [weekPeriods, setWeekPeriods] = useState(12);
  const [monthPeriods, setMonthPeriods] = useState(12);
  const [trendsOpen, setTrendsOpen] = useState(true);

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
        const forecastRes = await api.get('/api/analytics/visitor-forecast', { params: { window: windowSize, days: 30, includePersonnel: showPersonnel, algo, seasonLen: seasonLen, alpha, beta, gamma } });
        setForecast(forecastRes.data || null);
      } catch (e) {
        // don't block the rest of the dashboard if forecast fails
      } finally {
        setLoadingForecast(false);
      }
    })();
  }, [windowSize, showPersonnel, algo, seasonLen, alpha, beta, gamma]);

  // Load depth analytics (heatmap and trends)
  useEffect(() => {
    (async () => {
      try {
        const [hm, tw, tm] = await Promise.all([
          api.get('/api/analytics/hourly-heatmap', { params: { days: heatmapDays } }),
          api.get('/api/analytics/trends', { params: { granularity: 'week', periods: weekPeriods } }),
          api.get('/api/analytics/trends', { params: { granularity: 'month', periods: monthPeriods } }),
        ]);
        setHeatmap(hm.data || null);
        setTrendWeek(tw.data || null);
        setTrendMonth(tm.data || null);
      } catch {}
    })();
  }, [heatmapDays, weekPeriods, monthPeriods]);

  // Persist legend toggles and restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vt_forecast_toggles');
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v.showVisitors === 'boolean') setShowVisitors(v.showVisitors);
        if (typeof v.showVisitorsMA === 'boolean') setShowVisitorsMA(v.showVisitorsMA);
        if (typeof v.showPersonnelSeries === 'boolean') setShowPersonnelSeries(v.showPersonnelSeries);
        if (typeof v.showPersonnelMA === 'boolean') setShowPersonnelMA(v.showPersonnelMA);
        if (typeof v.showSeasonal === 'boolean') setShowSeasonal(v.showSeasonal);
        if (typeof v.overlayMA === 'boolean') setOverlayMA(v.overlayMA);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('vt_forecast_toggles', JSON.stringify({ showVisitors, showVisitorsMA, showPersonnelSeries, showPersonnelMA, showSeasonal, overlayMA }));
    } catch {}
  }, [showVisitors, showVisitorsMA, showPersonnelSeries, showPersonnelMA, showSeasonal, overlayMA]);

  const metrics = useMemo(() => {
    if (!forecast || !forecast.series || !forecast.movingAverage) return null;
    if (forecast.metrics) return forecast.metrics;
    const actual = forecast.series.map((d) => d.count);
    const ma = forecast.movingAverage.map((d) => (isNaN(d.ma as any) ? null : (d.ma as number)));
    const pairs: { a: number; p: number }[] = [];
    for (let i = 0; i < Math.min(actual.length, ma.length); i++) {
      if (ma[i] == null) continue;
      pairs.push({ a: actual[i], p: ma[i]! });
    }
    if (pairs.length === 0) return null;
    const absErrors = pairs.map(({ a, p }) => Math.abs(a - p));
    const sqErrors = pairs.map(({ a, p }) => (a - p) ** 2);
    const ape = pairs
      .filter(({ a }) => a !== 0)
      .map(({ a, p }) => Math.abs((a - p) / a));
    const mae = absErrors.reduce((s, v) => s + v, 0) / absErrors.length;
    const rmse = Math.sqrt(sqErrors.reduce((s, v) => s + v, 0) / sqErrors.length);
    const mape = ape.length ? (ape.reduce((s, v) => s + v, 0) / ape.length) * 100 : null;
    const residuals = pairs.map(({ a, p }) => a - p);
    const meanRes = residuals.reduce((s, v) => s + v, 0) / residuals.length;
    const varRes = residuals.reduce((s, v) => s + (v - meanRes) ** 2, 0) / Math.max(1, residuals.length - 1);
    const stdRes = Math.sqrt(Math.max(0, varRes));
    const point = forecast.nextDayForecast ?? null;
    const z = 1.96;
    const ci = point != null ? { lo: Math.max(0, Math.round(point - z * stdRes)), hi: Math.round(point + z * stdRes) } : null;
    return { mae, rmse, mape, ci };
  }, [forecast]);

  async function downloadForecastPNG() {
    const node = forecastSvgRef.current;
    if (!node) return;
    try {
      const dataUrl = await toPng(node as unknown as HTMLElement, { cacheBust: true, backgroundColor: '#ffffff' });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'visitor-forecast.png';
      a.click();
    } catch {}
  }

  function exportForecastCSV() {
    if (!forecast || !forecast.series) return;
    const header = ['date', 'visitors', 'visitors_ma', 'personnel', 'personnel_ma'];
    const rows: string[] = [header.join(',')];
    const len = forecast.series.length;
    for (let i = 0; i < len; i++) {
      const date = forecast.series[i]?.date || '';
      const v = forecast.series[i]?.count ?? '';
      const vma = (forecast.movingAverage[i]?.ma ?? '') as any;
      const p = forecast.seriesPersonnel?.[i]?.count ?? '';
      const pma = (forecast.movingAveragePersonnel?.[i]?.ma ?? '') as any;
      rows.push([date, String(v), String(vma), String(p), String(pma)].join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visitor-forecast.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z"/></svg>
        Dashboard
      </h2>
      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" aria-label="Summary metrics">
        {[{label:'Total Visitors', value: data?.totals?.visitors},{label:'Total Personnel', value: data?.totals?.personnel},{label:'Today Check-ins', value: data?.today?.checkIns},{label:'Currently Inside', value: data?.inside?.current}].map((m, idx) => {
          const palette = [
            'bg-emerald-600 dark:bg-emerald-700',
            'bg-indigo-600 dark:bg-indigo-700',
            'bg-amber-600 dark:bg-amber-700',
            'bg-rose-600 dark:bg-rose-700',
          ];
          const cardClass = `${palette[idx] || 'bg-slate-700'} rounded p-5 text-white shadow`;
          return (
            <div key={idx} className={cardClass}>
              <div className="text-sm md:text-base opacity-90">{m.label}</div>
              <div className="text-3xl md:text-4xl font-bold mt-1">{loading ? <span className="inline-block w-16 h-8 bg-white/30 animate-pulse rounded" /> : (m.value ?? '—')}</div>
            </div>
          );
        })}
      </div>
      <section>
      <div className="bg-white border border-slate-200 rounded p-4 lg:col-span-2 mt-6 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="font-semibold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/></svg>
            Visitor Forecast ({algo === 'ma' ? `Moving Average, ${windowSize}-day` : `Holt-Winters, season ${seasonLen}`})
          </div>
          <div className="w-full overflow-x-auto">
            <div className="inline-flex items-center gap-3 text-sm whitespace-nowrap">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="accent-indigo-500" checked={showPersonnel} onChange={(e) => setShowPersonnel(e.target.checked)} />
                Show personnel trend
              </label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="window-size">Window</label>
              <select id="window-size" aria-label="Forecast window size" className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={windowSize} onChange={(e)=> setWindowSize(parseInt(e.target.value) || 7)}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
                <option value={14}>14</option>
              </select>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="algo">Algo</label>
              <select id="algo" className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={algo} onChange={(e)=> setAlgo((e.target.value as 'ma'|'hw') || 'ma')}>
                <option value="ma">Moving Average</option>
                <option value="hw">Holt-Winters (seasonal)</option>
              </select>
              <div className="flex items-center gap-2">
                <button onClick={exportForecastCSV} className="px-2 py-1.5 rounded border text-xs border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Export CSV</button>
                <button onClick={downloadForecastPNG} className="px-2 py-1.5 rounded border text-xs border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Download PNG</button>
                {algo === 'hw' && (
                  <button onClick={()=> setShowAdvanced((v)=>!v)} className="px-2 py-1.5 rounded border text-xs border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{showAdvanced ? 'Hide Advanced' : 'Advanced'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
        {algo === 'hw' && showAdvanced && (
          <div className="mt-2 px-2 py-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="season">Season</label>
              <input id="season" type="number" min={2} max={14} className="w-20 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={seasonLen} onChange={(e)=> setSeasonLen(Math.max(2, Math.min(14, parseInt(e.target.value)||7)))} />
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="alpha">α</label>
              <input id="alpha" type="number" step="0.05" min={0.01} max={0.99} className="w-24 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={alpha} onChange={(e)=> setAlpha(Math.max(0.01, Math.min(0.99, parseFloat(e.target.value)||0.3)))} />
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="beta">β</label>
              <input id="beta" type="number" step="0.05" min={0.01} max={0.99} className="w-24 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={beta} onChange={(e)=> setBeta(Math.max(0.01, Math.min(0.99, parseFloat(e.target.value)||0.1)))} />
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" htmlFor="gamma">γ</label>
              <input id="gamma" type="number" step="0.05" min={0.01} max={0.99} className="w-24 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={gamma} onChange={(e)=> setGamma(Math.max(0.01, Math.min(0.99, parseFloat(e.target.value)||0.3)))} />
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="accent-indigo-500" checked={overlayMA} onChange={(e)=> setOverlayMA(e.target.checked)} /> Overlay MA
              </label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="accent-indigo-500" checked={showSeasonal} onChange={(e)=> setShowSeasonal(e.target.checked)} /> Seasonal (HW)
              </label>
            </div>
          </div>
        )}
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 my-3" />
        <div className="h-72 overflow-x-auto relative">
          {/* Prominent forecast value on the right */}
          <div className="absolute top-2 right-3 text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Next day forecast</div>
            <div className="text-3xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100">{loadingForecast ? '—' : (forecast?.nextDayForecast ?? '—')}</div>
            {metrics?.ci && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400">95% CI: {metrics.ci.lo}–{metrics.ci.hi}</div>
            )}
          </div>
          {loadingForecast ? (
            <div className="w-full h-full bg-slate-100 animate-pulse rounded dark:bg-slate-800/40" aria-busy="true" aria-label="Loading forecast" />
          ) : forecast && forecast.series?.length > 0 ? (
            <svg
              key={`${windowSize}-${showPersonnel}`}
              className="h-full"
              preserveAspectRatio="xMinYMin meet"
              ref={forecastSvgRef}
              width={(() => {
                const count = forecast.series.length;
                const pad = { left: 50, right: 20 };
                const minStep = 24;
                return Math.max(640, pad.left + pad.right + (count > 1 ? (count - 1) * minStep : 200));
              })()}
              viewBox={(() => {
                const count = forecast.series.length;
                const pad = { left: 50, right: 20, top: 16, bottom: 40 };
                const minStep = 24;
                const baseWidth = Math.max(640, pad.left + pad.right + (count > 1 ? (count - 1) * minStep : 200));
                const baseHeight = 260;
                return `0 0 ${baseWidth} ${baseHeight}`;
              })()}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {(() => {
                const data = forecast.series.map((d, i) => ({ x: i, count: d.count, date: d.date }));
                const ma = forecast.movingAverage.map((d, i) => ({ x: i, ma: isNaN(d.ma as any) ? null : d.ma }));
                const pdata = (forecast.seriesPersonnel || []).map((d, i) => ({ x: i, count: d.count, date: d.date }));
                const pma = (forecast.movingAveragePersonnel || []).map((d, i) => ({ x: i, ma: isNaN(d.ma as any) ? null : d.ma }));
                const maxY = Math.max(1, ...data.map((d) => d.count), ...ma.map((m) => m.ma || 0), ...pdata.map((d) => d.count || 0), ...pma.map((m) => m.ma || 0));
                const pad = { left: 50, right: 20, top: 16, bottom: 40 };
                const minStep = 24; // minimum pixels per label to avoid squish
                const baseWidth = Math.max(640, pad.left + pad.right + (data.length > 1 ? (data.length - 1) * minStep : 200));
                const baseHeight = 260;
                const width = baseWidth - pad.left - pad.right;
                const height = baseHeight - pad.top - pad.bottom;

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
                      {showVisitors && (
                        <path d={linePath(countPts)} fill="none" stroke="#38bdf8" strokeWidth={2} />
                      )}
                      {/* moving average segments */}
                      {overlayMA && showVisitorsMA && maSegments.map((seg, idx) => (
                        <path key={idx} d={linePath(seg)} fill="none" stroke="#f59e0b" strokeWidth={2} />
                      ))}
                      {/* seasonal smoothed (Holt-Winters) */}
                      {algo === 'hw' && showSeasonal && (forecast.smoothed || []).length > 0 && (
                        <path
                          d={linePath((forecast.smoothed || []).map((d, i) => ({ x: i * xStep, y: yScale(isNaN(d.value as any) ? 0 : (d.value as number)) })))}
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                        />
                      )}
                      {/* personnel series if enabled */}
                      {showPersonnel && pCountPts.length > 0 && (
                        <>
                          {showPersonnelSeries && (
                            <path d={linePath(pCountPts)} fill="none" stroke="#22c55e" strokeWidth={2} />
                          )}
                          {showPersonnelMA && pmaSegments.map((seg, idx) => (
                            <path key={`p${idx}`} d={linePath(seg)} fill="none" stroke="#e11d48" strokeWidth={2} />
                          ))}
                        </>
                      )}
                      {/* x labels (responsive density) */}
                      {(() => {
                        // Determine step to avoid overlapping labels based on pixel spacing
                        const step = xStep >= 40 ? 1 : xStep >= 28 ? 2 : xStep >= 20 ? 3 : xStep >= 16 ? 4 : Math.max(5, Math.ceil(64 / Math.max(1, xStep)));
                        return data.map((d, i) => {
                          if (i % step !== 0) return null;
                          // Shorten label when very tight: show just day-of-month
                          const label = xStep < 20 ? d.date.slice(8) : d.date.slice(5);
                          return (
                            <text key={d.date} x={pad.left + i * xStep} y={pad.top + height + 18} fontSize="11" textAnchor="middle" fill="#94a3b8">{label}</text>
                          );
                        });
                      })()}
                      {/* hover interaction layer */}
                      <g>
                        {data.map((d, i) => (
                          <rect
                            key={`h${i}`}
                            x={pad.left + i * xStep - xStep / 2}
                            y={pad.top}
                            width={Math.max(5, xStep)}
                            height={height}
                            fill="transparent"
                            onMouseEnter={() => setHoverIdx(i)}
                          />
                        ))}
                        {hoverIdx != null && hoverIdx >= 0 && hoverIdx < data.length && (
                          <g>
                            <line x1={pad.left + hoverIdx * xStep} y1={pad.top} x2={pad.left + hoverIdx * xStep} y2={pad.top + height} stroke="#94a3b8" strokeDasharray="4 4" />
                            {/* tooltip */}
                            {(() => {
                              const dx = pad.left + hoverIdx * xStep + 8;
                              const dy = pad.top + 8;
                              const a = data[hoverIdx].count;
                              const mv = ma[hoverIdx]?.ma ?? null;
                              return (
                                <g>
                                  <rect x={dx} y={dy} width={140} height={46} rx={6} fill="#0f172a" opacity="0.9" stroke="#334155" />
                                  <text x={dx + 8} y={dy + 16} fontSize="11" fill="#e2e8f0">{data[hoverIdx].date}</text>
                                  <text x={dx + 8} y={dy + 30} fontSize="11" fill="#38bdf8">Visitors: {a}</text>
                                  {mv != null && <text x={dx + 8} y={dy + 44} fontSize="11" fill="#f59e0b">MA: {Math.round(mv)}</text>}
                                </g>
                              );
                            })()}
                          </g>
                        )}
                      </g>
                      {/* legend (toggleable) */}
                      <g>
                        <g role="button" onClick={() => setShowVisitors((v) => !v)} className="cursor-pointer">
                          <rect x={pad.left} y={pad.top} width="10" height="2" fill="#38bdf8" opacity={showVisitors ? 1 : 0.3} />
                          <text x={pad.left + 16} y={pad.top + 3} fontSize="10" fill="#cbd5e1" opacity={showVisitors ? 1 : 0.5}>Visitors</text>
                        </g>
                        <g role="button" onClick={() => setShowVisitorsMA((v) => !v)} className="cursor-pointer">
                          <rect x={pad.left + 90} y={pad.top} width="10" height="2" fill="#f59e0b" opacity={showVisitorsMA ? 1 : 0.3} />
                          <text x={pad.left + 106} y={pad.top + 3} fontSize="10" fill="#cbd5e1" opacity={showVisitorsMA ? 1 : 0.5}>Visitors MA</text>
                        </g>
                        {algo === 'hw' && (
                          <g role="button" onClick={() => setShowSeasonal((v) => !v)} className="cursor-pointer">
                            <rect x={pad.left + 170} y={pad.top} width="10" height="2" fill="#8b5cf6" opacity={showSeasonal ? 1 : 0.3} />
                            <text x={pad.left + 186} y={pad.top + 3} fontSize="10" fill="#cbd5e1" opacity={showSeasonal ? 1 : 0.5}>Seasonal (HW)</text>
                          </g>
                        )}
                        {showPersonnel && (
                          <>
                            <g role="button" onClick={() => setShowPersonnelSeries((v) => !v)} className="cursor-pointer">
                              <rect x={pad.left + 280} y={pad.top} width="10" height="2" fill="#22c55e" opacity={showPersonnelSeries ? 1 : 0.3} />
                              <text x={pad.left + 296} y={pad.top + 3} fontSize="10" fill="#cbd5e1" opacity={showPersonnelSeries ? 1 : 0.5}>Personnel</text>
                            </g>
                            <g role="button" onClick={() => setShowPersonnelMA((v) => !v)} className="cursor-pointer">
                              <rect x={pad.left + 370} y={pad.top} width="10" height="2" fill="#e11d48" opacity={showPersonnelMA ? 1 : 0.3} />
                              <text x={pad.left + 386} y={pad.top + 3} fontSize="10" fill="#cbd5e1" opacity={showPersonnelMA ? 1 : 0.5}>Personnel MA</text>
                            </g>
                          </>
                        )}
                      </g>
                    </g>
                  );
                })()}
              </svg>
            ) : (
              <div className="text-slate-600 dark:text-slate-400 text-sm">No forecast data available for the selected window.</div>
            )}
        </div>
        {(forecast as any)?.fallbackUsed && algo === 'hw' && (
          <div className="mt-2 text-xs text-amber-600 dark:text-yellow-400">Insufficient seasonal history for Holt-Winters. Falling back to Moving Average for next-day estimate.</div>
        )}
        {/* metrics summary */}
        {metrics && (
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-4">
            <div>
              <span className="text-slate-500">MAE:</span> <span className="font-semibold">{metrics.mae.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">RMSE:</span> <span className="font-semibold">{metrics.rmse.toFixed(2)}</span>
            </div>
            {metrics.mape != null && (
              <div>
                <span className="text-slate-500">MAPE:</span> <span className="font-semibold">{metrics.mape.toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded p-4 lg:col-span-2">
          <div className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 text-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v4H4zM4 12h16v8H4z"/></svg>
            Recent Activity
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="h-32 bg-slate-100 animate-pulse rounded dark:bg-slate-800/40" aria-busy="true" aria-label="Loading recent activity" />
            ) : (
            <table className="min-w-full text-base" aria-label="Recent activity table">
              <thead className="text-slate-700 dark:text-slate-300 font-medium">
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
                    <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="py-2 pr-4">{subject}</td>
                      <td className="py-2 pr-4">{type}</td>
                      <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{r.timeIn ? new Date(r.timeIn).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{r.timeOut ? new Date(r.timeOut).toLocaleString() : '-'}</td>
                    </tr>
                  );
                })}
                {recent.length === 0 && (
                  <tr><td className="py-6 text-slate-600 dark:text-slate-400" colSpan={4}>No recent activity to display.</td></tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>
        {/* Weekly & Monthly Trends moved up and collapsible */}
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded p-4">
          <div className="font-semibold mb-3 flex items-center justify-between">
            <span>Weekly & Monthly Trends</span>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={() => setTrendsOpen((v)=>!v)} className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                {trendsOpen ? 'Hide' : 'Show'}
              </button>
              <label htmlFor="wk" className="text-slate-600 dark:text-slate-300">Weeks</label>
              <input id="wk" type="number" min={4} max={24} className="w-20 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={weekPeriods} onChange={(e)=> setWeekPeriods(Math.max(4, Math.min(24, parseInt(e.target.value)||12)))} />
              <label htmlFor="mo" className="text-slate-600 dark:text-slate-300">Months</label>
              <input id="mo" type="number" min={6} max={24} className="w-20 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={monthPeriods} onChange={(e)=> setMonthPeriods(Math.max(6, Math.min(24, parseInt(e.target.value)||12)))} />
            </div>
          </div>
          {trendsOpen && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Weekly (last {weekPeriods} weeks)</div>
                <div className="overflow-x-auto">
                  {trendWeek ? (
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left py-1 pr-4">Week</th>
                          <th className="text-left py-1">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendWeek.series.map((r) => (
                          <tr key={r.label} className="border-t border-slate-200 dark:border-slate-700">
                            <td className="py-1 pr-4">{r.label}</td>
                            <td className="py-1">{r.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-24 bg-slate-100 animate-pulse rounded dark:bg-slate-800/40" />
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Monthly (last {monthPeriods} months)</div>
                <div className="overflow-x-auto">
                  {trendMonth ? (
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left py-1 pr-4">Month</th>
                          <th className="text-left py-1">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendMonth.series.map((r) => (
                          <tr key={r.label} className="border-t border-slate-200 dark:border-slate-700">
                            <td className="py-1 pr-4">{r.label}</td>
                            <td className="py-1">{r.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-24 bg-slate-100 animate-pulse rounded dark:bg-slate-800/40" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Depth: Hourly heatmap */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded p-4">
          <div className="font-semibold mb-3 flex items-center justify-between">
            <span>Visitor Check-ins Heatmap</span>
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="hm-days" className="text-slate-600 dark:text-slate-300">Days</label>
              <input id="hm-days" type="number" min={7} max={120} className="w-20 bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={heatmapDays} onChange={(e)=> setHeatmapDays(Math.max(7, Math.min(120, parseInt(e.target.value)||30)))} />
            </div>
          </div>
          {heatmap ? (
            <div className="grid" style={{ gridTemplateColumns: `repeat(25, minmax(0,1fr))` }}>
              <div></div>
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="text-[10px] text-center text-slate-500">{h}</div>
              ))}
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, r) => (
                <React.Fragment key={d}>
                  <div className="text-[10px] text-right pr-1 text-slate-500">{d}</div>
                  {Array.from({ length: 24 }).map((_, c) => {
                    const v = heatmap.grid[r][c];
                    const intensity = Math.min(1, v / Math.max(1, ...heatmap.grid.flat()));
                    const bg = `rgba(99,102,241,${0.1 + 0.6*intensity})`;
                    return <div key={`${r}-${c}`} className="h-5 border border-slate-100 dark:border-slate-700" style={{ backgroundColor: bg }} title={`${d} ${c}:00 — ${v}`} />;
                  })}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="h-32 bg-slate-100 animate-pulse rounded dark:bg-slate-800/40" />
          )}
          {/* heatmap legend */}
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
            <span>Low</span>
            <div className="h-2 w-32 bg-gradient-to-r from-indigo-200 to-indigo-600 rounded"></div>
            <span>High</span>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
