import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { requireAuth, signToken } from '../lib/auth';
import { isEmail } from '../lib/validate';

const router = Router();

const USER_COLUMNS = `user_id AS "userId", full_name AS "fullName", email, avatar_url AS "avatarUrl"`;

// Đăng ký
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body ?? {};

    if (
      typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 255 ||
      !isEmail(email) ||
      typeof password !== 'string' || password.length < 8 || password.length > 128
    ) {
      res.status(400).json({ message: 'Cần họ tên, email hợp lệ và mật khẩu từ 8 ký tự' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING ${USER_COLUMNS}`,
      [fullName.trim(), email.trim().toLowerCase(), passwordHash]
    );

    res.status(201).json({ token: signToken(rows[0].userId), user: rows[0] });
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ message: 'Email đã được sử dụng' });
      return;
    }
    next(err);
  }
});

// Đăng nhập
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!isEmail(email) || typeof password !== 'string') {
      res.status(400).json({ message: 'Cần email và mật khẩu' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT user_id, full_name, email, avatar_url, password_hash
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const row = rows[0];
    const ok = row ? await bcrypt.compare(password, row.password_hash) : false;
    if (!ok) {
      // Thông báo chung để không lộ email nào đã đăng ký
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const user = {
      userId: row.user_id,
      fullName: row.full_name,
      email: row.email,
      avatarUrl: row.avatar_url,
    };
    res.json({ token: signToken(user.userId), user });
  } catch (err) {
    next(err);
  }
});

// Thông tin người dùng hiện tại
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE user_id = $1`,
      [req.user!.userId]
    );
    if (!rows[0]) {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
