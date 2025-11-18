import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sequelize } from './lib/db';
import type { Request, Response } from 'express';
import { syncSchema } from './models';
import authRouter from './routes/auth';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

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
