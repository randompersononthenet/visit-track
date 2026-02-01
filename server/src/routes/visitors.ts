import { Router } from 'express';
import { Op } from 'sequelize';
import { Visitor } from '../models/Visitor';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../lib/validation';
import { v4 as uuidv4 } from 'uuid';
import { requireRole } from '../middleware/roles';
import { audit } from '../lib/audit';

const router = Router();

// All routes require auth
router.use(requireAuth);

// List visitors with simple filters and pagination
router.get('/', requireRole('admin', 'staff', 'officer', 'warden', 'analyst'), async (req, res) => {
  const { q, page = '1', pageSize = '20', type } = req.query as Record<string, string>;
  const p = Math.max(parseInt(page) || 1, 1);
  const ps = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100);
  const where: any = {};
  if (q) {
    where.fullName = { [Op.iLike]: `%${q}%` };
  }
  if (type === 'regular' || type === 'special') where.type = type;
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
  relation: z.string().max(200).optional(),
  qrCode: z.string().max(200).optional(),
  photoUrl: z.string().max(500).optional(),
  blacklistStatus: z.boolean().optional(),
  type: z.enum(['regular','special']).optional(),
});

router.post('/', requireRole('admin', 'staff'), validate(createVisitorSchema), async (req, res) => {
  const { firstName, middleName, lastName, contact, idNumber, relation, qrCode, photoUrl, blacklistStatus, type } = (req as any).parsed;
  const normFirst = (firstName || '').trim().toUpperCase();
  const normMiddleRaw = (middleName || '').trim();
  const normMiddle = normMiddleRaw ? normMiddleRaw.toUpperCase() : undefined;
  const normLast = (lastName || '').trim().toUpperCase();
  const normFull = [normFirst, normMiddle, normLast].filter(Boolean).join(' ');
  const normContact = (contact || '').trim();

  if (normContact) {
    const whereDup: any = {
      firstName: normFirst,
      lastName: normLast,
      contact: normContact,
    };
    if (normMiddle) whereDup.middleName = normMiddle; else whereDup.middleName = { [Op.is]: null };
    const existing = await Visitor.findOne({ where: whereDup });
    if (existing) return res.status(409).json({ error: 'Duplicate visitor exists with same name and contact' });
  }
  const initials = `${(normFirst || '').charAt(0)}${(normLast || '').charAt(0)}`.toUpperCase() || 'XX';
  const ymd = new Date();
  const yyyy = ymd.getFullYear();
  const mm = String(ymd.getMonth() + 1).padStart(2, '0');
  const dd = String(ymd.getDate()).padStart(2, '0');
  const autoId = `VISIT${initials}${yyyy}${mm}${dd}`;
  const v = await Visitor.create({
    firstName: normFirst,
    middleName: normMiddle,
    lastName: normLast,
    fullName: normFull,
    contact: normContact || undefined,
    idNumber: idNumber || autoId,
    relation,
    qrCode: qrCode || uuidv4(),
    photoUrl,
    blacklistStatus,
    type: type || 'regular',
  });
  await audit(req as any, 'create', 'visitor', v.id, { fullName: normFull, idNumber: v.idNumber });
  res.status(201).json(v);
});

// Get visitor by id
router.get('/:id', requireRole('admin', 'staff', 'officer'), async (req, res) => {
  const v = await Visitor.findByPk(Number(req.params.id));
  if (!v) return res.status(404).json({ error: 'Not found' });
  res.json(v);
});

// Update visitor
const updateVisitorSchema = createVisitorSchema.partial().extend({
  riskLevel: z.enum(['none','low','medium','high']).optional(),
  flagReason: z.string().max(1000).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  blacklistStatus: z.boolean().optional(),
});

router.patch('/:id', requireRole('admin', 'staff'), validate(updateVisitorSchema), async (req, res) => {
  const id = Number(req.params.id);
  const v = await Visitor.findByPk(id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  const { firstName, middleName, lastName, contact, idNumber, relation, qrCode, photoUrl, blacklistStatus, riskLevel, flagReason } = (req as any).parsed;

  // Determine effective fields after patch, then normalize names to uppercase and contact trimmed
  const effFirstRaw = typeof firstName !== 'undefined' ? firstName : v.firstName;
  const effMiddleRaw = typeof middleName !== 'undefined' ? middleName : v.middleName;
  const effLastRaw = typeof lastName !== 'undefined' ? lastName : v.lastName;
  const effContactRaw = typeof contact !== 'undefined' ? contact : v.contact;

  const normFirst = (effFirstRaw || '').toString().trim().toUpperCase();
  const normMiddle = (effMiddleRaw || '') ? (effMiddleRaw as string).toString().trim().toUpperCase() : undefined;
  const normLast = (effLastRaw || '').toString().trim().toUpperCase();
  const normFull = [normFirst, normMiddle, normLast].filter(Boolean).join(' ');
  const normContact = (effContactRaw || '').toString().trim();

  // Duplicate check if contact present: same normalized names + same contact, excluding this record
  if (normContact) {
    const whereDup: any = { firstName: normFirst, lastName: normLast, contact: normContact };
    if (normMiddle) whereDup.middleName = normMiddle; else whereDup.middleName = { [Op.is]: null };
    const existing = await Visitor.findOne({ where: { ...whereDup, id: { [Op.ne]: v.id } } });
    if (existing) return res.status(409).json({ error: 'Duplicate visitor exists with same name and contact' });
  }

  const updates: any = {
    firstName: normFirst,
    middleName: normMiddle,
    lastName: normLast,
    fullName: normFull,
    contact: normContact || undefined,
    idNumber,
    relation,
    qrCode,
    photoUrl,
    blacklistStatus,
  };
  const riskFieldsTouched = typeof riskLevel !== 'undefined' || typeof flagReason !== 'undefined';
  if (typeof riskLevel !== 'undefined') updates.riskLevel = riskLevel;
  if (typeof flagReason !== 'undefined') updates.flagReason = flagReason;
  if (riskFieldsTouched) {
    updates.flagUpdatedBy = (req as any).user?.id ?? null;
    updates.flagUpdatedAt = new Date();
  }
  await v.update(updates);
  await audit(req as any, 'update', 'visitor', v.id, { fields: Object.keys(updates) });
  res.json(v);
});

// Delete visitor
router.delete('/:id', requireRole('admin', 'staff'), async (req, res) => {
  const id = Number(req.params.id);
  const v = await Visitor.findByPk(id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  await v.destroy();
  await audit(req as any, 'delete', 'visitor', v.id, { fullName: v.fullName });
  res.status(204).send();
});

export default router;
