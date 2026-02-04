import { Router } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { Visitor } from '../models/Visitor';
import { Personnel } from '../models/Personnel';
import { VisitLog } from '../models/VisitLog';
import { sequelize } from '../lib/db';

const router = Router();

router.use(requireAuth);

router.get('/summary', requireRole('admin', 'staff', 'officer', 'warden', 'analyst'), async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [visitors, personnel, todayCheckIns, inside] = await Promise.all([
    Visitor.count(),
    Personnel.count(),
    VisitLog.count({ where: { timeIn: { [Op.gte]: startOfDay, [Op.lte]: endOfDay } } }),
    VisitLog.count({ where: { timeOut: null } }),
  ]);

  res.json({
    totals: { visitors, personnel },
    today: { checkIns: todayCheckIns },
    inside: { current: inside },
  });
});

router.get('/checkins-7d', requireRole('admin', 'staff', 'warden', 'analyst'), async (_req, res) => {
  // Build last 7 calendar days including today
  const days: { date: string; start: Date; end: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const dateStr = start.toISOString().slice(0, 10);
    days.push({ date: dateStr, start, end });
  }

  const counts: { date: string; count: number }[] = [];
  for (const { date, start, end } of days) {
    const count = await VisitLog.count({ where: { timeIn: { [Op.gte]: start, [Op.lte]: end } } });
    counts.push({ date, count });
  }

  res.json({ days: counts });
});

router.get('/visitor-forecast', requireRole('admin', 'staff', 'warden', 'analyst'), async (req, res) => {
  const window = Math.max(1, Math.min(30, parseInt(String(req.query.window || '7')) || 7));
  const daysParam = Math.max(window, Math.min(120, parseInt(String(req.query.days || '30')) || 30));
  const includePersonnel = String(req.query.includePersonnel || 'false') === 'true';
  const algo = String(req.query.algo || 'ma'); // 'ma' | 'hw'
  const seasonLen = Math.max(2, Math.min(14, parseInt(String(req.query.seasonLen || '7')) || 7));
  const alpha = Math.max(0.01, Math.min(0.99, parseFloat(String(req.query.alpha || '0.3')) || 0.3));
  const beta = Math.max(0.01, Math.min(0.99, parseFloat(String(req.query.beta || '0.1')) || 0.1));
  const gamma = Math.max(0.01, Math.min(0.99, parseFloat(String(req.query.gamma || '0.3')) || 0.3));

  // last daysParam days including today
  const days: { date: string; start: Date; end: Date }[] = [];
  for (let i = daysParam - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const dateStr = start.toISOString().slice(0, 10);
    days.push({ date: dateStr, start, end });
  }

  const series: { date: string; count: number }[] = [];
  const seriesPersonnel: { date: string; count: number }[] = [];
  for (const { date, start, end } of days) {
    const count = await VisitLog.count({ where: { visitorId: { [Op.not]: null }, timeIn: { [Op.gte]: start, [Op.lte]: end } } });
    series.push({ date, count });
    if (includePersonnel) {
      const pcount = await VisitLog.count({ where: { personnelId: { [Op.not]: null }, timeIn: { [Op.gte]: start, [Op.lte]: end } } });
      seriesPersonnel.push({ date, count: pcount });
    }
  }

  // simple moving average over trailing window
  const ma: { date: string; ma: number }[] = [];
  for (let i = 0; i < series.length; i++) {
    if (i + 1 >= window) {
      const slice = series.slice(i + 1 - window, i + 1);
      const avg = slice.reduce((s, v) => s + v.count, 0) / window;
      ma.push({ date: series[i].date, ma: Number(avg.toFixed(2)) });
    } else {
      ma.push({ date: series[i].date, ma: NaN });
    }
  }

  // Holt-Winters additive (weekly seasonality default)
  function holtWintersAdditive(x: number[], m: number, alpha = 0.3, beta = 0.1, gamma = 0.3) {
    if (x.length < m * 2) return null;
    const L: number[] = [];
    const B: number[] = [];
    const S: number[] = new Array(x.length).fill(0);
    const seasonAvg = x.slice(0, m).reduce((s, v) => s + v, 0) / m;
    const nextSeasonAvg = x.slice(m, 2 * m).reduce((s, v) => s + v, 0) / m;
    // initializations
    L[0] = seasonAvg;
    B[0] = (nextSeasonAvg - seasonAvg) / m;
    for (let i = 0; i < m; i++) S[i] = x[i] - seasonAvg;
    const fitted: (number | null)[] = new Array(x.length).fill(null);
    for (let t = 1; t < x.length; t++) {
      const Stm = t - m >= 0 ? S[t - m] : S[(t % m)];
      const Lt = alpha * (x[t] - Stm) + (1 - alpha) * (L[t - 1] + B[t - 1]);
      const Bt = beta * (Lt - L[t - 1]) + (1 - beta) * B[t - 1];
      const St = gamma * (x[t] - Lt) + (1 - gamma) * Stm;
      L[t] = Lt; B[t] = Bt; S[t] = St;
      if (t - 1 >= 0 && t - m >= 0) {
        fitted[t] = L[t - 1] + B[t - 1] + S[t - m]; // one-step ahead fitted
      }
    }
    const h = 1;
    const next = L[x.length - 1] + h * B[x.length - 1] + S[x.length - m];
    return { fitted, next: Number(next.toFixed(2)) };
  }

  let nextForecast: number | null = null;
  let smoothed: { date: string; value: number }[] | undefined;
  let fallbackUsed = false;
  if (algo === 'hw') {
    const x = series.map((d) => d.count);
    const hw = holtWintersAdditive(x, seasonLen, alpha, beta, gamma);
    if (hw) {
      nextForecast = hw.next;
      smoothed = hw.fitted.map((v, i) => (v == null || isNaN(v) ? null : Number((v as number).toFixed(2)))).map((v, i) => ({ date: series[i].date, value: v as any })).filter((d) => d.value != null) as any;
    } else {
      // fallback to MA if insufficient data
      const lastWindow = series.slice(-window);
      nextForecast = lastWindow.length === window ? Number((lastWindow.reduce((s, v) => s + v.count, 0) / window).toFixed(2)) : null;
      fallbackUsed = true;
    }
  } else {
    const lastWindow = series.slice(-window);
    nextForecast = lastWindow.length === window ? Number((lastWindow.reduce((s, v) => s + v.count, 0) / window).toFixed(2)) : null;
  }

  let maPersonnel: { date: string; ma: number }[] | undefined;
  let nextForecastPersonnel: number | null | undefined;
  if (includePersonnel) {
    maPersonnel = [];
    for (let i = 0; i < seriesPersonnel.length; i++) {
      if (i + 1 >= window) {
        const slice = seriesPersonnel.slice(i + 1 - window, i + 1);
        const avg = slice.reduce((s, v) => s + v.count, 0) / window;
        maPersonnel.push({ date: seriesPersonnel[i].date, ma: Number(avg.toFixed(2)) });
      } else {
        maPersonnel.push({ date: seriesPersonnel[i].date, ma: NaN });
      }
    }
    const lastPWindow = seriesPersonnel.slice(-window);
    nextForecastPersonnel = lastPWindow.length === window ? Number((lastPWindow.reduce((s, v) => s + v.count, 0) / window).toFixed(2)) : null;
  }

  // metrics and CI (based on residuals)
  function computeMetrics(actual: number[], predicted: (number | null)[]) {
    const pairs: { a: number; p: number }[] = [];
    for (let i = 0; i < Math.min(actual.length, predicted.length); i++) {
      const p = predicted[i];
      if (p == null || isNaN(p)) continue;
      pairs.push({ a: actual[i], p });
    }
    if (!pairs.length) return undefined;
    const abs = pairs.map(({ a, p }) => Math.abs(a - p));
    const sq = pairs.map(({ a, p }) => (a - p) ** 2);
    const ape = pairs.filter(({ a }) => a !== 0).map(({ a, p }) => Math.abs((a - p) / a));
    const mae = Number((abs.reduce((s, v) => s + v, 0) / abs.length).toFixed(2));
    const rmse = Number(Math.sqrt(sq.reduce((s, v) => s + v, 0) / sq.length).toFixed(2));
    const mape = ape.length ? Number(((ape.reduce((s, v) => s + v, 0) / ape.length) * 100).toFixed(2)) : undefined;
    const residuals = pairs.map(({ a, p }) => a - p);
    const meanRes = residuals.reduce((s, v) => s + v, 0) / residuals.length;
    const varRes = residuals.reduce((s, v) => s + (v - meanRes) ** 2, 0) / Math.max(1, residuals.length - 1);
    const stdRes = Math.sqrt(Math.max(0, varRes));
    const z = 1.96;
    const ci = nextForecast != null ? { lo: Math.max(0, Math.round(nextForecast - z * stdRes)), hi: Math.round(nextForecast + z * stdRes) } : undefined;
    return { mae, rmse, mape, ci } as any;
  }

  const actualVec = series.map((d) => d.count);
  const predictedVec = algo === 'hw'
    ? series.map((_, i) => {
        // build from smoothed by aligning dates; may be missing initial points
        const s = (smoothed || []).find((d) => d.date === series[i].date);
        return s ? (s.value as number) : null;
      })
    : ma.map((d) => (isNaN(d.ma) ? null : d.ma));
  const metrics = computeMetrics(actualVec, predictedVec);
  // derive baseline (last moving average) and confidence label
  const baseline = (() => {
    const last = ma.length ? ma[ma.length - 1] : null;
    const v = last && typeof last.ma === 'number' && !isNaN(last.ma) ? last.ma : undefined;
    return v != null ? Number(v.toFixed(0)) : undefined;
  })();
  const confidence = (() => {
    const mape = (metrics as any)?.mape as number | undefined;
    if (mape == null) return undefined;
    if (mape <= 10) return 'high';
    if (mape <= 20) return 'medium';
    return 'low';
  })();
  const explanation = (() => {
    const parts: string[] = [];
    parts.push(algo === 'hw' ? `Holt-Winters (season=${seasonLen})` : `Moving Average (window=${window})`);
    if (algo === 'hw') {
      parts.push(`α=${alpha}, β=${beta}, γ=${gamma}`);
      if (fallbackUsed) parts.push('fallback to MA due to limited season data');
    }
    if (confidence) parts.push(`confidence: ${confidence}`);
    return parts.join('; ');
  })();

  res.json({
    window,
    algo,
    seasonLen: algo === 'hw' ? seasonLen : undefined,
    alpha: algo === 'hw' ? alpha : undefined,
    beta: algo === 'hw' ? beta : undefined,
    gamma: algo === 'hw' ? gamma : undefined,
    series,
    movingAverage: ma,
    smoothed: smoothed,
    nextDayForecast: nextForecast,
    seriesPersonnel: includePersonnel ? seriesPersonnel : undefined,
    movingAveragePersonnel: includePersonnel ? maPersonnel : undefined,
    nextDayForecastPersonnel: includePersonnel ? nextForecastPersonnel : undefined,
    metrics,
    fallbackUsed: algo === 'hw' ? fallbackUsed : undefined,
    baseline,
    confidence,
    explanation,
  });
});

// Hourly heatmap: returns counts for dayOfWeek (0-6) x hour (0-23) for last N days
router.get('/hourly-heatmap', requireRole('admin', 'staff', 'warden', 'analyst'), async (req, res) => {
  const days = Math.max(1, Math.min(120, parseInt(String(req.query.days || '30')) || 30));
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const end = new Date();
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const logs = await VisitLog.findAll({ where: { timeIn: { [Op.gte]: start, [Op.lte]: end } }, attributes: ['timeIn'] });
  for (const l of logs) {
    const t = new Date((l as any).timeIn);
    const dow = t.getDay();
    const hour = t.getHours();
    grid[dow][hour] += 1;
  }
  res.json({ days, grid });
});

// Aggregated trends by week or month for last N periods
router.get('/trends', requireRole('admin', 'staff', 'warden', 'analyst'), async (req, res) => {
  const granularity = String(req.query.granularity || 'week'); // 'week' | 'month'
  const periods = Math.max(1, Math.min(24, parseInt(String(req.query.periods || '12')) || 12));
  const out: { label: string; count: number }[] = [];
  const ref = new Date();
  ref.setHours(0, 0, 0, 0);
  for (let i = periods - 1; i >= 0; i--) {
    let start = new Date(ref);
    let end = new Date(ref);
    if (granularity === 'month') {
      start.setMonth(start.getMonth() - i, 1); start.setDate(1);
      start.setHours(0,0,0,0);
      end = new Date(start); end.setMonth(start.getMonth() + 1); end.setDate(0); end.setHours(23,59,59,999);
      const label = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}`;
      const count = await VisitLog.count({ where: { timeIn: { [Op.gte]: start, [Op.lte]: end } } });
      out.push({ label, count });
    } else {
      // week: ISO week starting Monday
      const d = new Date(ref);
      d.setDate(d.getDate() - i * 7);
      const day = d.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      start = new Date(d); start.setDate(d.getDate() + diffToMonday); start.setHours(0,0,0,0);
      end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
      const weekStr = `${start.getFullYear()}-W${String(Math.ceil((((start.getTime() - new Date(start.getFullYear(),0,1).getTime())/86400000)+ new Date(start.getFullYear(),0,1).getDay()+1)/7)).padStart(2,'0')}`;
      const count = await VisitLog.count({ where: { timeIn: { [Op.gte]: start, [Op.lte]: end } } });
      out.push({ label: weekStr, count });
    }
  }
  res.json({ granularity, series: out });
});

// Frequent visitors over a timeframe (defaults to last 30 days)
// GET /api/analytics/frequent-visitors?days=30&limit=10&minVisits=2
router.get('/frequent-visitors', requireRole('admin', 'staff', 'warden', 'analyst'), async (req, res) => {
  const days = Math.max(1, Math.min(365, parseInt(String(req.query.days || '30')) || 30));
  const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '10')) || 10));
  const minVisits = Math.max(1, Math.min(1000, parseInt(String(req.query.minVisits || '1')) || 1));
  const since = new Date();
  since.setHours(0,0,0,0);
  since.setDate(since.getDate() - (days - 1));

  // Raw SQL for efficiency: aggregate by visitor_id within timeframe
  const rows = await sequelize.query(
    `
      SELECT v.id AS "visitorId",
             v.full_name AS "fullName",
             COUNT(l.id) AS visits,
             COUNT(DISTINCT DATE(l.time_in)) AS "daysVisited",
             MAX(l.time_in) AS "lastVisit",
             AVG(l.duration_seconds) FILTER (WHERE l.duration_seconds IS NOT NULL) AS "avgDurationSeconds"
      FROM visit_logs l
      JOIN visitors v ON v.id = l.visitor_id
      WHERE l.visitor_id IS NOT NULL
        AND l.time_in >= :since
      GROUP BY v.id, v.full_name
      HAVING COUNT(l.id) >= :minVisits
      ORDER BY visits DESC, "daysVisited" DESC, "lastVisit" DESC
      LIMIT :limit
    `,
    { replacements: { since, limit, minVisits }, type: QueryTypes.SELECT as any }
  );

  res.json({ days, limit, minVisits, data: rows });
});

// All-time frequent visitors with optional min/max filters
// GET /api/analytics/frequent-visitors-all?minVisits=1&maxVisits=&limit=20
router.get('/frequent-visitors-all', requireRole('admin', 'staff', 'warden', 'analyst'), async (req, res) => {
  const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit || '20')) || 20));
  const minVisits = Math.max(1, Math.min(100000, parseInt(String(req.query.minVisits || '1')) || 1));
  const maxVisitsRaw = req.query.maxVisits as string | undefined;
  const maxVisits = maxVisitsRaw != null && maxVisitsRaw !== '' ? Math.max(minVisits, Math.min(100000, parseInt(String(maxVisitsRaw)) || minVisits)) : null;

  const whereHaving = maxVisits == null
    ? 'COUNT(l.id) >= :minVisits'
    : 'COUNT(l.id) BETWEEN :minVisits AND :maxVisits';

  const rows = await sequelize.query(
    `
      SELECT v.id AS "visitorId",
             v.full_name AS "fullName",
             COUNT(l.id) AS visits,
             COUNT(DISTINCT DATE(l.time_in)) AS "daysVisited",
             MAX(l.time_in) AS "lastVisit",
             AVG(l.duration_seconds) FILTER (WHERE l.duration_seconds IS NOT NULL) AS "avgDurationSeconds"
      FROM visit_logs l
      JOIN visitors v ON v.id = l.visitor_id
      WHERE l.visitor_id IS NOT NULL
      GROUP BY v.id, v.full_name
      HAVING ${whereHaving}
      ORDER BY visits DESC, "lastVisit" DESC
      LIMIT :limit
    `,
    { replacements: { limit, minVisits, maxVisits }, type: QueryTypes.SELECT as any }
  );

  res.json({ limit, minVisits, maxVisits, data: rows });
});

export default router;
