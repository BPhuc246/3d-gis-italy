import { Router } from 'express';
import { pool } from '../db/pool';
import { optionalAuth, requireAuth } from '../lib/auth';
import { isSlug } from '../lib/validate';

const router = Router();

async function findDestinationId(slug: string): Promise<string | null> {
  const { rows } = await pool.query(
    'SELECT destination_id FROM tourist_destination WHERE slug = $1',
    [slug]
  );
  return rows[0]?.destination_id ?? null;
}

// Danh sách địa điểm: ?category=&q=
router.get('/', async (req, res, next) => {
  try {
    const category =
      typeof req.query.category === 'string' && req.query.category ? req.query.category : null;
    const q =
      typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim().slice(0, 100) : null;

    const { rows } = await pool.query(
      `SELECT d.destination_id AS "destinationId", d.slug, d.name, d.address, d.category,
              d.cover_image_url AS "coverImageUrl", d.latitude, d.longitude,
              ROUND(AVG(r.rating)::numeric, 1)::float8 AS "avgRating",
              COUNT(r.review_id)::int AS "reviewCount"
       FROM tourist_destination d
       LEFT JOIN review r ON r.destination_id = d.destination_id
       WHERE ($1::text IS NULL OR d.category = $1)
         AND ($2::text IS NULL OR d.name ILIKE '%' || $2 || '%')
       GROUP BY d.destination_id
       ORDER BY d.name
       LIMIT 100`,
      [category, q]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Chi tiết địa điểm kèm ảnh, đánh giá và trạng thái yêu thích
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!isSlug(slug)) {
      res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      return;
    }

    const { rows: dRows } = await pool.query(
      `SELECT d.destination_id AS "destinationId", d.slug, d.name, d.description, d.address,
              d.latitude, d.longitude, d.category, c.label AS "categoryLabel",
              d.opening_hours AS "openingHours", d.entry_fee::float8 AS "entryFee",
              d.entry_fee_currency AS "entryFeeCurrency", d.cover_image_url AS "coverImageUrl"
       FROM tourist_destination d
       JOIN destination_category c ON c.code = d.category
       WHERE d.slug = $1`,
      [slug]
    );
    const dest = dRows[0];
    if (!dest) {
      res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      return;
    }

    const [images, reviews, stats, fav] = await Promise.all([
      pool.query(
        `SELECT image_url AS "imageUrl", image_type AS "imageType", caption, is_primary AS "isPrimary"
         FROM destination_image WHERE destination_id = $1
         ORDER BY is_primary DESC, image_id`,
        [dest.destinationId]
      ),
      pool.query(
        `SELECT r.review_id AS "reviewId", r.user_id AS "userId", u.full_name AS "authorName",
                r.rating, r.comment, r.updated_at AS "updatedAt"
         FROM review r JOIN users u ON u.user_id = r.user_id
         WHERE r.destination_id = $1
         ORDER BY r.updated_at DESC LIMIT 20`,
        [dest.destinationId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS "reviewCount",
                ROUND(AVG(rating)::numeric, 1)::float8 AS "avgRating"
         FROM review WHERE destination_id = $1`,
        [dest.destinationId]
      ),
      req.user
        ? pool.query(
            'SELECT 1 FROM favorite WHERE user_id = $1 AND destination_id = $2',
            [req.user.userId, dest.destinationId]
          )
        : Promise.resolve({ rowCount: 0 }),
    ]);

    res.json({
      ...dest,
      images: images.rows,
      reviews: reviews.rows,
      reviewCount: stats.rows[0].reviewCount,
      avgRating: stats.rows[0].avgRating,
      isFavorite: (fav.rowCount ?? 0) > 0,
    });
  } catch (err) {
    next(err);
  }
});

// Thêm hoặc sửa đánh giá của người dùng hiện tại
router.put('/:slug/review', requireAuth, async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const { rating, comment } = req.body ?? {};

    if (!isSlug(slug)) {
      res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Số sao phải là số nguyên từ 1 đến 5' });
      return;
    }
    if (comment !== undefined && comment !== null && (typeof comment !== 'string' || comment.length > 2000)) {
      res.status(400).json({ message: 'Bình luận tối đa 2000 ký tự' });
      return;
    }

    const destinationId = await findDestinationId(slug);
    if (!destinationId) {
      res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      return;
    }

    // updated_at được cập nhật tự động bằng trigger
    const { rows } = await pool.query(
      `INSERT INTO review (user_id, destination_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, destination_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
       RETURNING review_id AS "reviewId", user_id AS "userId", rating, comment, updated_at AS "updatedAt"`,
      [req.user!.userId, destinationId, rating, comment?.trim() || null]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Xóa đánh giá của người dùng hiện tại
router.delete('/:slug/review', requireAuth, async (req, res, next) => {
  try {
    const destinationId = await findDestinationId(req.params.slug);
    if (!destinationId) {
      res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      return;
    }
    await pool.query('DELETE FROM review WHERE user_id = $1 AND destination_id = $2', [
      req.user!.userId,
      destinationId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Thêm yêu thích
router.post('/:slug/favorite', requireAuth, async (req, res, next) => {
  try {
    const destinationId = await findDestinationId(req.params.slug);
    if (!destinationId) {
      res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      return;
    }
    await pool.query(
      `INSERT INTO favorite (user_id, destination_id) VALUES ($1, $2)
       ON CONFLICT (user_id, destination_id) DO NOTHING`,
      [req.user!.userId, destinationId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Bỏ yêu thích
router.delete('/:slug/favorite', requireAuth, async (req, res, next) => {
  try {
    const destinationId = await findDestinationId(req.params.slug);
    if (!destinationId) {
      res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      return;
    }
    await pool.query('DELETE FROM favorite WHERE user_id = $1 AND destination_id = $2', [
      req.user!.userId,
      destinationId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
