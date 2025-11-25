import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAuth } from '../middleware/auth';
import { VisitLog } from '../models/VisitLog';
import { Visitor } from '../models/Visitor';
import { Personnel } from '../models/Personnel';

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/visit-logs?subjectType=visitor|personnel&subjectId=...&dateFrom=ISO&dateTo=ISO&page=&pageSize=
router.get('/', async (req, res) => {
  const { subjectType, subjectId, dateFrom, dateTo, page = '1', pageSize = '20' } = req.query as Record<string, string>;

  const p = Math.max(parseInt(page) || 1, 1);
  const ps = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100);

  const where: any = {};
  if (subjectType === 'visitor') {
    where.visitorId = subjectId ? Number(subjectId) : { [Op.ne]: null };
  } else if (subjectType === 'personnel') {
    where.personnelId = subjectId ? Number(subjectId) : { [Op.ne]: null };
  } else if (subjectId) {
    // If subjectId supplied without subjectType, search both columns for that id
    where[Op.or] = [{ visitorId: Number(subjectId) }, { personnelId: Number(subjectId) }];
  }

  if (dateFrom || dateTo) {
    where.timeIn = {} as any;
    if (dateFrom) (where.timeIn as any)[Op.gte] = new Date(dateFrom);
    if (dateTo) (where.timeIn as any)[Op.lte] = new Date(dateTo);
  }

  const { rows, count } = await VisitLog.findAndCountAll({
    where,
    order: [['timeIn', 'DESC']],
    offset: (p - 1) * ps,
    limit: ps,
    include: [
      { model: Visitor, as: 'visitor', attributes: ['id', 'fullName', 'firstName', 'middleName', 'lastName'] },
      { model: Personnel, as: 'personnel', attributes: ['id', 'fullName', 'firstName', 'middleName', 'lastName', 'roleTitle'] },
    ],
  });

  res.json({ data: rows, total: count, page: p, pageSize: ps });
});

export default router;
