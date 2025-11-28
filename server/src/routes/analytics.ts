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

export default router;
