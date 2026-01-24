import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Role } from '../models/Role';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  const user = await User.findOne({ where: { username }, include: [{ model: Role, as: 'role' }] });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if ((user as any).disabled) return res.status(403).json({ error: 'Account disabled' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role ? (user.role as any).name : undefined }, secret, { expiresIn: '8h' });
  return res.json({ token, user: { id: user.id, username: user.username, role: user.role ? (user.role as any).name : undefined } });
});

router.get('/me', async (req, res) => {
  // This endpoint expects the auth middleware to attach req.user; leaving open for now to be public no-token basic.
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = header.slice('Bearer '.length);
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as any;
    const user = await User.findByPk(payload.id, { include: [{ model: Role, as: 'role' }] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user.id, username: user.username, role: user.role ? (user.role as any).name : undefined });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
