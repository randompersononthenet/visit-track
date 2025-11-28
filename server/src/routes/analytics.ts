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

export default router;
