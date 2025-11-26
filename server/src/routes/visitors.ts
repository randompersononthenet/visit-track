import { Router } from 'express';
import { Op } from 'sequelize';
import { Visitor } from '../models/Visitor';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../lib/validation';
import { v4 as uuidv4 } from 'uuid';
import { requireRole } from '../middleware/roles';

const router = Router();

// All routes require auth
router.use(requireAuth);

// List visitors with simple filters and pagination
router.get('/', requireRole('admin', 'staff', 'officer'), async (req, res) => {
  const { q, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const p = Math.max(parseInt(page) || 1, 1);
  const ps = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100);
  const where: any = {};
  if (q) {
    where.fullName = { [Op.iLike]: `%${q}%` };
  }
  const { rows, count } = await Visitor.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    offset: (p - 1) * ps,
    limit: ps,
  });
  res.json({ data: rows, total: count, page: p, pageSize: ps });
});

// Create visitor
const createVisitorSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  lastName: z.string().min(1),
  contact: z.string().max(100).optional(),
  idNumber: z.string().max(100).optional(),
  relation: z.string().max(100).optional(),
  qrCode: z.string().max(200).optional(),
  blacklistStatus: z.boolean().optional(),
});

router.post('/', requireRole('admin', 'staff'), validate(createVisitorSchema), async (req, res) => {
  const { firstName, middleName, lastName, contact, idNumber, relation, qrCode, blacklistStatus } = (req as any).parsed;
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const v = await Visitor.create({
    firstName,
    middleName,
    lastName,
    fullName,
    contact,
    idNumber,
    relation,
    qrCode: qrCode || uuidv4(),
    blacklistStatus,
  });
  res.status(201).json(v);
});

// Get visitor by id
router.get('/:id', requireRole('admin', 'staff', 'officer'), async (req, res) => {
  const v = await Visitor.findByPk(Number(req.params.id));
  if (!v) return res.status(404).json({ error: 'Not found' });
  res.json(v);
});

// Update visitor
const updateVisitorSchema = createVisitorSchema.partial();

router.patch('/:id', requireRole('admin', 'staff'), validate(updateVisitorSchema), async (req, res) => {
  const id = Number(req.params.id);
  const v = await Visitor.findByPk(id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  const { firstName, middleName, lastName, contact, idNumber, relation, qrCode, blacklistStatus } = (req as any).parsed;
  const computedFullName = (
    [firstName ?? v.firstName, middleName ?? v.middleName, lastName ?? v.lastName]
      .filter(Boolean)
      .join(' ')
  );
  await v.update({ firstName, middleName, lastName, fullName: computedFullName, contact, idNumber, relation, qrCode, blacklistStatus });
  res.json(v);
});

// Delete visitor
router.delete('/:id', requireRole('admin', 'staff'), async (req, res) => {
  const id = Number(req.params.id);
  const v = await Visitor.findByPk(id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  await v.destroy();
  res.status(204).send();
});

export default router;
