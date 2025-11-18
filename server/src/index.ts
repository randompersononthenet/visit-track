import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sequelize } from './lib/db';
import type { Request, Response } from 'express';
import { syncSchema } from './models';
import authRouter from './routes/auth';
import visitorsRouter from './routes/visitors';
import personnelRouter from './routes/personnel';
import scanRouter from './routes/scan';

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json());

// Routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/visitors', visitorsRouter);
app.use('/api/personnel', personnelRouter);
app.use('/api/scan', scanRouter);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: (err as Error).message });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    await syncSchema();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

start();
