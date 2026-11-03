import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import healthRouter from './routes/health';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(express.json());

  app.use('/api', healthRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Không tìm thấy đường dẫn' });
  });

  return app;
}
