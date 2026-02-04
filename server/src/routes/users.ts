import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { audit } from '../lib/audit';

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
  await audit(req as any, 'create', 'user', created.id, { username, role: roleName });
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
  await audit(req as any, 'reset_password', 'user', user.id, { username: user.username });
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
  await audit(req as any, disabled ? 'disable' : 'enable', 'user', user.id, { username: user.username });
  res.json({ id: user.id, disabled: (user as any).disabled });
});

// Rename a user (admin-only)
// PATCH /api/users/:id/username { username: string }
router.patch('/:id/username', async (req, res) => {
  const id = Number(req.params.id);
  const { username } = req.body || {};
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const exists = await User.findOne({ where: { username }, attributes: ['id'] });
  if (exists && exists.id !== user.id) return res.status(409).json({ error: 'Username already exists' });
  const old = user.username;
  await user.update({ username });
  await audit(req as any, 'rename', 'user', user.id, { from: old, to: username });
  res.json({ id: user.id, username: user.username });
});

export default router;
