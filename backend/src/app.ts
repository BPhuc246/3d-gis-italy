import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import destinationsRouter from './routes/destinations';
import meRouter from './routes/me';
import routesRouter from './routes/routes';
import regionsRouter from './routes/regions';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/destinations', destinationsRouter);
  app.use('/api/me', meRouter);
  app.use('/api/routes', routesRouter);
  app.use('/api/regions', regionsRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Không tìm thấy đường dẫn' });
  });

  app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res
      .status(err.status ?? 500)
      .json({ message: err.status ? 'Dữ liệu gửi lên không hợp lệ' : 'Lỗi máy chủ' });
  });

  return app;
}
