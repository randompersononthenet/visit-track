import { Router } from 'express';
import { Op } from 'sequelize';
import { Personnel } from '../models/Personnel';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All routes require auth
router.use(requireAuth);

// List personnel with filters and pagination
router.get('/', async (req, res) => {
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
router.post('/', async (req, res) => {
  const { fullName, roleTitle, qrCode } = req.body || {};
  if (!fullName) return res.status(400).json({ error: 'fullName is required' });
  const rec = await Personnel.create({ fullName, roleTitle, qrCode });
  res.status(201).json(rec);
});

// Get by id
router.get('/:id', async (req, res) => {
  const rec = await Personnel.findByPk(Number(req.params.id));
  if (!rec) return res.status(404).json({ error: 'Not found' });
  res.json(rec);
});

// Update
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const rec = await Personnel.findByPk(id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  const { fullName, roleTitle, qrCode } = req.body || {};
  await rec.update({ fullName, roleTitle, qrCode });
  res.json(rec);
});

// Delete
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const rec = await Personnel.findByPk(id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  await rec.destroy();
  res.status(204).send();
});

export default router;
