import path from 'path';
import dotenv from 'dotenv';

// Đọc .env ở thư mục gốc (../.env) rồi đến backend/.env nếu có
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL ?? 'http://localhost:4000',
  DB_POSTGRES: required('DB_POSTGRES'),
};
