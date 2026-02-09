import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AuditLog } from '../models/AuditLog';

const router = Router();
router.use(requireAuth);
router.use(requirePermission('audit:view'));

router.get('/', async (req, res) => {
  const { q, action, entityType, actor, page = '1', pageSize = '20', from, to } = req.query as Record<string, string>;
  const p = Math.max(parseInt(page) || 1, 1);
  const ps = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100);
  const where: any = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (actor) where.actorUsername = { [Op.iLike]: `%${actor}%` };
  if (q) {
    where[Op.or] = [
      { action: { [Op.iLike]: `%${q}%` } },
      { entityType: { [Op.iLike]: `%${q}%` } },
      { actorUsername: { [Op.iLike]: `%${q}%` } },
    ];
  }
  if (from || to) {
    where.createdAt = {} as any;
    if (from) (where.createdAt as any)[Op.gte] = new Date(from);
    if (to) (where.createdAt as any)[Op.lte] = new Date(to);
  }
  const { rows, count } = await (AuditLog as any).findAndCountAll({
    where,
    order: [['id', 'DESC']],
    offset: (p - 1) * ps,
    limit: ps,
  });
  res.json({ data: rows, total: count, page: p, pageSize: ps });
});

export default router;
