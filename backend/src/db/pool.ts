import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.DB_POSTGRES,
});

pool.on('error', (err) => {
  console.error('Lỗi PostgreSQL pool:', err.message);
});
