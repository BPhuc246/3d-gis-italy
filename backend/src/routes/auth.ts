import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool";
import { requireAuth, signToken } from "../lib/auth";
import { isEmail } from "../lib/validate";

const router = Router();

const BCRYPT_COST = 12;
// Hash giả: luôn chạy bcrypt khi email không tồn tại, tránh lộ email qua thời gian phản hồi
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_COST);

const PUBLIC_USER_SQL = `user_id AS "userId", full_name AS "fullName", email, avatar_url AS "avatarUrl"`;

type PublicUser = {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

router.post("/register", async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body ?? {};
    const name = typeof fullName === "string" ? fullName.trim() : "";

    if (
      !name ||
      name.length > 255 ||
      !isEmail(email) ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return void res.status(400).json({
        message: "Cần họ tên, email hợp lệ và mật khẩu từ 8 ký tự, tối đa 72 byte UTF-8",
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const { rows } = await pool.query<PublicUser>(
      `INSERT INTO app_user (full_name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING ${PUBLIC_USER_SQL}`,
      [name, email.trim().toLowerCase(), passwordHash],
    );
    res.status(201).json({ token: signToken(rows[0].userId), user: rows[0] });
  } catch (err) {
    if ((err as { code?: string }).code === "23505")
      return void res.status(409).json({ message: "Email đã được sử dụng" });
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!isEmail(email) || typeof password !== "string")
      return void res.status(400).json({ message: "Cần email và mật khẩu" });

    const { rows } = await pool.query<PublicUser & { passwordHash: string }>(
      `SELECT ${PUBLIC_USER_SQL}, password_hash AS "passwordHash"
       FROM app_user WHERE email = $1`,
      [email.trim().toLowerCase()],
    );
    const row = rows[0];
    const ok = await bcrypt.compare(password, row?.passwordHash ?? DUMMY_HASH);
    if (!row || !ok)
      return void res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });

    const user: PublicUser = {
      userId: row.userId,
      fullName: row.fullName,
      email: row.email,
      avatarUrl: row.avatarUrl,
    };
    res.json({ token: signToken(user.userId), user });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query<PublicUser>(
      `SELECT ${PUBLIC_USER_SQL} FROM app_user WHERE user_id = $1`,
      [req.user!.userId],
    );
    if (!rows[0])
      return void res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
