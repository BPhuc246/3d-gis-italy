import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type AuthPayload = { userId: string };

// Gắn thông tin người dùng vào req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

function readUser(req: Request): AuthPayload | null {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { userId?: string };
    return payload.userId ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
}

// Có token thì đọc, không có thì vẫn cho qua
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readUser(req);
  if (user) req.user = user;
  next();
}

// Bắt buộc có token hợp lệ
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = readUser(req);
  if (!user) {
    res.status(401).json({ message: 'Cần đăng nhập' });
    return;
  }
  req.user = user;
  next();
}
