import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { sequelize } from './lib/db';
import type { Request, Response } from 'express';
import { syncSchema } from './models';
import authRouter from './routes/auth';
import visitorsRouter from './routes/visitors';
import personnelRouter from './routes/personnel';
import scanRouter from './routes/scan';
import visitLogsRouter from './routes/visitLogs';
import reportsRouter from './routes/reports';
import analyticsRouter from './routes/analytics';
import violationsRouter from './routes/violations';
import uploadsRouter from './routes/uploads';
import preregRouter from './routes/prereg';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { Role } from './models/Role';

const app = express();
app.use(helmet({
  // Allow images (e.g., /uploads/*) to be fetched from other origins like http://localhost:5173
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS: allow Vite dev server and, in development, any origin (e.g., phone via LAN IP)
app.use(
  cors({
    origin: (origin, cb) => {
      const isDev = process.env.NODE_ENV !== 'production';
      const allowList = new Set<string>([
        'http://localhost:5173',
      ]);
      if (!origin) return cb(null, true); // non-browser or same-origin
      if (isDev) return cb(null, true); // relax in dev for LAN testing
      if (allowList.has(origin)) return cb(null, true);
      return cb(new Error('CORS not allowed'), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json({ limit: '6mb' }));
// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/visitors', visitorsRouter);
app.use('/api/personnel', personnelRouter);
app.use('/api/scan', scanRouter);
app.use('/api/visit-logs', visitLogsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/violations', violationsRouter);
app.use('/api/prereg', preregRouter);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: (err as Error).message });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    await syncSchema();
    await bootstrapAdmin();
    app.listen(PORT, HOST, () => {
      console.log(`Server listening on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

start();

async function bootstrapAdmin() {
  const isProd = process.env.NODE_ENV === 'production';
  const shouldBootstrap = process.env.BOOTSTRAP_ADMIN === 'true' || (!isProd);
  if (!shouldBootstrap) return;

  // Ensure roles exist
  const roleNames: Array<'admin'|'staff'|'officer'> = ['admin','staff','officer'];
  for (const name of roleNames) {
    // @ts-ignore
    await Role.findOrCreate({ where: { name }, defaults: { name } });
  }

  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS || 'admin123';
  const roleName = (process.env.ADMIN_ROLE as any) || 'admin';
  const role = await Role.findOne({ where: { name: roleName } });
  if (!role) return;

  const existing = await User.findOne({ where: { username } });
  const passwordHash = await bcrypt.hash(password, 10);
  if (!existing) {
    await User.create({ username, passwordHash, roleId: role.id });
    console.log(`Bootstrap: created user '${username}' with role '${roleName}'`);
  } else if (process.env.RESET_ADMIN_PASSWORD === 'true') {
    await existing.update({ passwordHash, roleId: role.id });
    console.log(`Bootstrap: reset password for user '${username}'`);
  }
}
