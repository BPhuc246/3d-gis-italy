import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../lib/auth';
import { isSlug } from '../lib/validate';

const router = Router();
const CANDLE_SLUGS = new Set(['pantheon', 'vittoriano']);
const COOLDOWN_MIN = 10;

async function findDestinationId(slug: string): Promise<string | null> {
  const { rows } = await pool.query(
    'SELECT destination_id FROM tourist_destination WHERE slug = $1',
    [slug]
  );
  return rows[0]?.destination_id ?? null;
}

// Danh sách video và âm thanh của địa điểm
router.get('/:slug/experiences', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const destinationId = isSlug(slug) ? await findDestinationId(slug) : null;
    if (!destinationId) return void res.status(404).json({ message: 'Không tìm thấy địa điểm' });

    const { rows } = await pool.query(
      `SELECT feature_key AS "featureKey", kind, asset_url AS "assetUrl", license, credit
       FROM destination_experience
       WHERE destination_id = $1
       ORDER BY sort_order, experience_id`,
      [destinationId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Tổng số nến đã thắp
router.get('/:slug/candles', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!isSlug(slug) || !CANDLE_SLUGS.has(slug)) {
      return void res.status(404).json({ message: 'Địa điểm này không có nến tưởng niệm' });
    }
    const destinationId = await findDestinationId(slug);
    if (!destinationId) return void res.status(404).json({ message: 'Không tìm thấy địa điểm' });

    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS total FROM memorial_candle WHERE destination_id = $1',
      [destinationId]
    );
    res.json({ total: rows[0].total });
  } catch (err) {
    next(err);
  }
});

// Thắp nến: mỗi người cách nhau tối thiểu 10 phút ở mỗi địa điểm
router.post('/:slug/candles', requireAuth, async (req, res, next) => {
  const slug = req.params.slug;
  if (!isSlug(slug) || !CANDLE_SLUGS.has(slug)) {
    return void res.status(404).json({ message: 'Địa điểm này không có nến tưởng niệm' });
  }

  const userId = req.user!.userId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: dest } = await client.query(
      'SELECT destination_id FROM tourist_destination WHERE slug = $1',
      [slug]
    );
    const destinationId: string | undefined = dest[0]?.destination_id;
    if (!destinationId) {
      await client.query('ROLLBACK');
      return void res.status(404).json({ message: 'Không tìm thấy địa điểm' });
    }

    // Khóa theo cặp (người dùng, địa điểm) để hai yêu cầu đồng thời không vượt giới hạn
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${userId}:${destinationId}`]);

    const { rowCount } = await client.query(
      `SELECT 1 FROM memorial_candle
       WHERE user_id = $1 AND destination_id = $2
         AND lit_at > NOW() - make_interval(mins => $3)`,
      [userId, destinationId, COOLDOWN_MIN]
    );
    if (rowCount) {
      await client.query('ROLLBACK');
      return void res.status(429).json({ message: `Vui lòng đợi ${COOLDOWN_MIN} phút giữa các lần thắp nến` });
    }

    await client.query(
      'INSERT INTO memorial_candle (destination_id, user_id) VALUES ($1, $2)',
      [destinationId, userId]
    );
    const { rows } = await client.query(
      'SELECT COUNT(*)::int AS total FROM memorial_candle WHERE destination_id = $1',
      [destinationId]
    );
    await client.query('COMMIT');
    res.status(201).json({ total: rows[0].total });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    next(err);
  } finally {
    client.release();
  }
});

export default router;