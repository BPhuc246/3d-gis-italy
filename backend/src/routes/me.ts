import { Router } from "express";
import { pool } from "../db/pool";
import { requireAuth } from "../lib/auth";
import { COVER_URL_SQL } from "../lib/destination-data";

const router = Router();

// Yêu thích của người dùng hiện tại, mới nhất trước
router.get("/favorites", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.slug, d.name, d.category,
              COALESCE(d.category_label, d.category) AS "categoryLabel",
              ${COVER_URL_SQL} AS "coverUrl",
              f.created_at AS "favoritedAt"
       FROM favorite f
       JOIN tourist_destination d ON d.destination_id = f.destination_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user!.userId],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
