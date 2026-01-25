import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { z } from 'zod';
import { validate } from '../lib/validation';
import { Violation } from '../models/Violation';
import { audit } from '../lib/audit';

const router = Router();

router.use(requireAuth);

// List violations (optionally filter by visitorId), basic pagination
router.get('/', requireRole('admin', 'staff', 'officer'), async (req, res) => {
  const { visitorId, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const p = Math.max(parseInt(page) || 1, 1);
  const ps = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100);
  const where: any = {};
  if (visitorId) where.visitorId = Number(visitorId);
  const { rows, count } = await Violation.findAndCountAll({
    where,
    order: [['recordedAt', 'DESC']],
    offset: (p - 1) * ps,
    limit: ps,
  });
  res.json({ data: rows, total: count, page: p, pageSize: ps });
});

// Alias: list by visitor
router.get('/visitor/:id', requireRole('admin', 'staff', 'officer'), async (req, res) => {
  const id = Number(req.params.id);
  const rows = await Violation.findAll({ where: { visitorId: id }, order: [['recordedAt', 'DESC']], limit: 200 });
  res.json({ data: rows });
});

const createViolationSchema = z.object({
  level: z.string().min(1).max(50), // e.g., low|medium|high|critical
  details: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
});

router.post('/visitor/:id', requireRole('admin', 'staff'), validate(createViolationSchema), async (req, res) => {
  const visitorId = Number(req.params.id);
  const { level, details, recordedAt } = (req as any).parsed;
  const v = await Violation.create({ visitorId, level, details: details ?? null, recordedAt: recordedAt ? new Date(recordedAt) : new Date() });
  await audit(req as any, 'create', 'violation', v.id, { visitorId, level });
  res.status(201).json(v);
});

export default router;
