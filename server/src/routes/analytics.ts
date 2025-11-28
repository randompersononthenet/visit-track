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

  // next-day forecast = average of last window counts
  const lastWindow = series.slice(-window);
  const nextForecast = lastWindow.length === window ? Number((lastWindow.reduce((s, v) => s + v.count, 0) / window).toFixed(2)) : null;

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

  res.json({ window, series, movingAverage: ma, nextDayForecast: nextForecast, seriesPersonnel: includePersonnel ? seriesPersonnel : undefined, movingAveragePersonnel: includePersonnel ? maPersonnel : undefined, nextDayForecastPersonnel: includePersonnel ? nextForecastPersonnel : undefined });
});

export default router;
