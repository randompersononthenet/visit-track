import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { Visitor } from '../models/Visitor';
import { Personnel } from '../models/Personnel';
import { VisitLog } from '../models/VisitLog';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'staff', 'officer'));

router.get('/summary', async (_req, res) => {
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

router.get('/checkins-7d', async (_req, res) => {
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

router.get('/visitor-forecast', async (req, res) => {
  const window = Math.max(1, Math.min(30, parseInt(String(req.query.window || '7')) || 7));
  const daysParam = Math.max(window, Math.min(120, parseInt(String(req.query.days || '30')) || 30));
  const includePersonnel = String(req.query.includePersonnel || 'false') === 'true';
  const algo = String(req.query.algo || 'ma'); // 'ma' | 'hw'
  const seasonLen = Math.max(2, Math.min(14, parseInt(String(req.query.seasonLen || '7')) || 7));

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
  if (algo === 'hw') {
    const x = series.map((d) => d.count);
    const hw = holtWintersAdditive(x, seasonLen);
    if (hw) {
      nextForecast = hw.next;
      smoothed = hw.fitted.map((v, i) => (v == null || isNaN(v) ? null : Number((v as number).toFixed(2)))).map((v, i) => ({ date: series[i].date, value: v as any })).filter((d) => d.value != null) as any;
    } else {
      // fallback to MA if insufficient data
      const lastWindow = series.slice(-window);
      nextForecast = lastWindow.length === window ? Number((lastWindow.reduce((s, v) => s + v.count, 0) / window).toFixed(2)) : null;
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

  res.json({
    window,
    algo,
    seasonLen: algo === 'hw' ? seasonLen : undefined,
    series,
    movingAverage: ma,
    smoothed: smoothed,
    nextDayForecast: nextForecast,
    seriesPersonnel: includePersonnel ? seriesPersonnel : undefined,
    movingAveragePersonnel: includePersonnel ? maPersonnel : undefined,
    nextDayForecastPersonnel: includePersonnel ? nextForecastPersonnel : undefined,
    metrics,
  });
});

export default router;
