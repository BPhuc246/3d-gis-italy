import { createApp } from './app';
import { env } from './config/env';
import { pool } from './db/pool';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Backend đang chạy tại ${env.BACKEND_URL}`);
  console.log(`CORS cho phép: ${env.FRONTEND_URL}`);
});

async function shutdown(signal: string) {
  console.log(`Nhận ${signal}, đang tắt server...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
