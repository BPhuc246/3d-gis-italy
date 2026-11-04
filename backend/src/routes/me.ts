import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../lib/auth';

const router = Router();

// Danh sách yêu thích của người dùng hiện tại
router.get('/favorites', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.slug, d.name, d.category, d.cover_image_url AS "coverImageUrl",
              f.created_at AS "favoritedAt"
       FROM favorite f
       JOIN tourist_destination d ON d.destination_id = f.destination_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user!.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
