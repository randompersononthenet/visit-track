import { Router } from 'express';
import { Op } from 'sequelize';
import { Personnel } from '../models/Personnel';
import { requireAuth } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { validate } from '../lib/validation';
import { requireRole } from '../middleware/roles';

const router = Router();

// All routes require auth
router.use(requireAuth);

// List personnel with filters and pagination
router.get('/', requireRole('admin', 'staff', 'officer', 'warden', 'analyst'), async (req, res) => {
  const { q, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const p = Math.max(parseInt(page) || 1, 1);
  const ps = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100);
  const where: any = {};
  if (q) {
    where.fullName = { [Op.iLike]: `%${q}%` };
  }
  const { rows, count } = await Personnel.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    offset: (p - 1) * ps,
    limit: ps,
  });
  res.json({ data: rows, total: count, page: p, pageSize: ps });
});

// Create personnel
const createPersonnelSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  lastName: z.string().min(1),
  roleTitle: z.string().max(100).optional(),
  qrCode: z.string().max(200).optional(),
  photoUrl: z.string().max(500).optional(),
});

router.post('/', requireRole('admin', 'staff'), validate(createPersonnelSchema), async (req, res) => {
  const { firstName, middleName, lastName, roleTitle, qrCode, photoUrl } = (req as any).parsed;
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const rec = await Personnel.create({ firstName, middleName, lastName, fullName, roleTitle, qrCode: qrCode || uuidv4(), photoUrl });
  res.status(201).json(rec);
});

// Get by id
router.get('/:id', requireRole('admin', 'staff', 'officer', 'warden', 'analyst'), async (req, res) => {
  const rec = await Personnel.findByPk(Number(req.params.id));
  if (!rec) return res.status(404).json({ error: 'Not found' });
  res.json(rec);
});

// Update
const updatePersonnelSchema = createPersonnelSchema.partial();

router.patch('/:id', requireRole('admin', 'staff'), validate(updatePersonnelSchema), async (req, res) => {
  const id = Number(req.params.id);
  const rec = await Personnel.findByPk(id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  const { firstName, middleName, lastName, roleTitle, qrCode, photoUrl } = (req as any).parsed;
  const computedFullName = (
    [firstName ?? rec.firstName, middleName ?? rec.middleName, lastName ?? rec.lastName]
      .filter(Boolean)
      .join(' ')
  );
  await rec.update({ firstName, middleName, lastName, fullName: computedFullName, roleTitle, qrCode, photoUrl });
  res.json(rec);
});

// Delete
router.delete('/:id', requireRole('admin', 'staff'), async (req, res) => {
  const id = Number(req.params.id);
  const rec = await Personnel.findByPk(id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  await rec.destroy();
  res.status(204).send();
});

export default router;
