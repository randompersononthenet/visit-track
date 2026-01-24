import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { User } from '../models/User';
import { Role } from '../models/Role';

const router = Router();
router.use(requireAuth);
router.use(requireRole('admin'));

// Create a user (admin-only). Only non-admin roles are allowed.
// POST /api/users { username: string, password: string, role: 'staff'|'officer' }
router.post('/', async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || typeof username !== 'string' || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const roleName = String(role || '').toLowerCase();
  if (!['staff','officer'].includes(roleName)) {
    return res.status(400).json({ error: 'Invalid role. Allowed roles: staff, officer' });
  }
  const exists = await User.findOne({ where: { username } });
  if (exists) return res.status(409).json({ error: 'Username already exists' });
  const roleRec = await Role.findOne({ where: { name: roleName } });
  if (!roleRec) return res.status(400).json({ error: 'Role not found' });
  const hash = await bcrypt.hash(password, 10);
  const created = await User.create({ username, passwordHash: hash, roleId: roleRec.id });
  const safe = { id: created.id, username: created.username, roleId: created.roleId, disabled: (created as any).disabled, createdAt: created.createdAt, updatedAt: created.updatedAt };
  res.status(201).json(safe);
});

// Minimal admin-only password reset for existing users
// PATCH /api/users/:id/password { password: string }
router.patch('/:id/password', async (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body || {};
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const hash = await bcrypt.hash(password, 10);
  await user.update({ passwordHash: hash });
  res.json({ status: 'ok' });
});

// List users (basic), excluding password hashes
router.get('/', async (_req, res) => {
  const users = await User.findAll({ attributes: ['id', 'username', 'roleId', 'disabled', 'createdAt', 'updatedAt'], include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }] });
  res.json({ data: users });
});

// Enable/disable a user
// PATCH /api/users/:id/disabled { disabled: boolean }
router.patch('/:id/disabled', async (req, res) => {
  const id = Number(req.params.id);
  const { disabled } = req.body || {};
  if (typeof disabled !== 'boolean') return res.status(400).json({ error: 'disabled must be boolean' });
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.update({ disabled });
  res.json({ id: user.id, disabled: (user as any).disabled });
});

export default router;
