import { Response, Router } from "express";
import { pool } from "../db/pool";
import { optionalAuth, requireAuth } from "../lib/auth";
import {
  BUILDING_SQL,
  COVER_URL_SQL,
  findDestinationId,
  loadGallery,
  loadModels,
} from "../lib/destination-data";
import { escapeLike, pageBody, parsePage, readString } from "../lib/paging";
import { isSlug } from "../lib/validate";

const router = Router();
const MAX_COMMENT = 2000;
const notFound = (res: Response) =>
  res.status(404).json({ message: "Không tìm thấy địa điểm" });

const REVIEW_SQL = `r.review_id AS "reviewId", r.user_id AS "userId",
  u.full_name AS "authorName", r.rating, r.comment, r.updated_at AS "updatedAt"`;

const RATING_SQL = `(SELECT ROUND(AVG(x.rating)::numeric, 1)::float8 FROM review x
   WHERE x.destination_id = d.destination_id) AS "avgRating",
  (SELECT COUNT(*)::int FROM review x WHERE x.destination_id = d.destination_id) AS "reviewCount"`;

const UPSERT_REVIEW_SQL = `
  WITH target AS (
    SELECT destination_id FROM tourist_destination WHERE slug = $2
  ), saved AS (
    INSERT INTO review (user_id, destination_id, rating, comment)
    SELECT $1::uuid, t.destination_id, $3::smallint, $4::text FROM target t
    ON CONFLICT (user_id, destination_id) DO UPDATE SET
      rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = now()
    RETURNING review_id, user_id, rating, comment, updated_at
  )
  SELECT s.review_id AS "reviewId", s.user_id AS "userId", u.full_name AS "authorName",
         s.rating, s.comment, s.updated_at AS "updatedAt"
  FROM saved s JOIN app_user u ON u.user_id = s.user_id`;

async function myReviewFor(userId: string, destinationId: string) {
  const { rows } = await pool.query(
    `SELECT ${REVIEW_SQL} FROM review r JOIN app_user u ON u.user_id = r.user_id
     WHERE r.user_id = $1 AND r.destination_id = $2`,
    [userId, destinationId],
  );
  return rows[0] ?? null;
}

async function isFavorited(userId: string, destinationId: string) {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM favorite WHERE user_id = $1 AND destination_id = $2",
    [userId, destinationId],
  );
  return (rowCount ?? 0) > 0;
}

// Danh sách địa điểm: ?category=&q=&limit=&offset=
router.get("/", async (req, res, next) => {
  try {
    const category = readString(req.query.category, 100);
    const q = readString(req.query.q, 100);
    const pattern = q ? `%${escapeLike(q)}%` : null;
    const page = parsePage(req.query);

    const where = `WHERE ($1::text IS NULL OR d.category = $1)
      AND ($2::text IS NULL OR d.name ILIKE $2 ESCAPE '\\')`;

    const [{ rows }, { rows: total }] = await Promise.all([
      pool.query(
        `SELECT d.destination_id AS "destinationId", d.slug, d.name, d.address, d.category,
                COALESCE(d.category_label, d.category) AS "categoryLabel",
                ${COVER_URL_SQL} AS "coverUrl",
                ST_Y(d.location::geometry) AS latitude, ST_X(d.location::geometry) AS longitude,
                ROUND(AVG(r.rating)::numeric, 1)::float8 AS "avgRating",
                COUNT(r.review_id)::int AS "reviewCount"
         FROM tourist_destination d
         LEFT JOIN review r ON r.destination_id = d.destination_id
         ${where}
         GROUP BY d.destination_id
         ORDER BY d.name
         LIMIT $3 OFFSET $4`,
        [category, pattern, page.limit, page.offset],
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM tourist_destination d ${where}`, [
        category,
        pattern,
      ]),
    ]);
    res.json(pageBody(rows, total[0].total, page));
  } catch (err) {
    next(err);
  }
});

// Chi tiết: thông tin, khối công trình, mô hình Sketchfab, ảnh, đánh giá và trạng thái người dùng
router.get("/:slug", optionalAuth, async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!isSlug(slug)) return void notFound(res);

    const { rows } = await pool.query(
      `SELECT d.destination_id AS "destinationId", d.slug, d.name, d.description, d.address,
              d.category, COALESCE(d.category_label, d.category) AS "categoryLabel",
              d.opening_hours AS "openingHours",
              d.entry_fee::float8 AS "entryFee", d.entry_fee_currency AS "entryFeeCurrency",
              d.display_color AS "displayColor", ${COVER_URL_SQL} AS "coverUrl",
              ST_Y(d.location::geometry) AS latitude, ST_X(d.location::geometry) AS longitude,
              ${BUILDING_SQL}, ${RATING_SQL}
       FROM tourist_destination d WHERE d.slug = $1`,
      [slug],
    );
    const dest = rows[0];
    if (!dest) return void notFound(res);

    const userId = req.user?.userId ?? null;
    const [models, gallery, isFavorite, myReview] = await Promise.all([
      loadModels([dest.destinationId]),
      loadGallery([dest.destinationId]),
      userId ? isFavorited(userId, dest.destinationId) : Promise.resolve(false),
      userId ? myReviewFor(userId, dest.destinationId) : Promise.resolve(null),
    ]);

    res.json({
      ...dest,
      models: models.get(dest.destinationId) ?? [],
      images: gallery.get(dest.destinationId) ?? [],
      isFavorite,
      myReview,
    });
  } catch (err) {
    next(err);
  }
});

// Đánh giá có phân trang, mới nhất trước
router.get("/:slug/reviews", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!isSlug(slug)) return void notFound(res);
    const destinationId = await findDestinationId(slug);
    if (!destinationId) return void notFound(res);

    const page = parsePage(req.query, 10, 50);
    const [{ rows }, { rows: total }] = await Promise.all([
      pool.query(
        `SELECT ${REVIEW_SQL} FROM review r JOIN app_user u ON u.user_id = r.user_id
         WHERE r.destination_id = $1
         ORDER BY r.updated_at DESC LIMIT $2 OFFSET $3`,
        [destinationId, page.limit, page.offset],
      ),
      pool.query("SELECT COUNT(*)::int AS total FROM review WHERE destination_id = $1", [
        destinationId,
      ]),
    ]);
    res.json(pageBody(rows, total[0].total, page));
  } catch (err) {
    next(err);
  }
});

router.put("/:slug/reviews/me", requireAuth, async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const { rating, comment } = req.body ?? {};
    if (!isSlug(slug)) return void notFound(res);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return void res.status(400).json({ message: "Số sao phải là số nguyên từ 1 đến 5" });
    if (comment != null && (typeof comment !== "string" || comment.length > MAX_COMMENT))
      return void res.status(400).json({ message: `Bình luận tối đa ${MAX_COMMENT} ký tự` });

    const { rows } = await pool.query(UPSERT_REVIEW_SQL, [
      req.user!.userId,
      slug,
      rating,
      typeof comment === "string" ? comment.trim() || null : null,
    ]);
    if (!rows[0]) return void notFound(res);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:slug/reviews/me", requireAuth, async (req, res, next) => {
  try {
    const destinationId = await findDestinationId(req.params.slug);
    if (!destinationId) return void notFound(res);
    await pool.query("DELETE FROM review WHERE user_id = $1 AND destination_id = $2", [
      req.user!.userId,
      destinationId,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Idempotent: gọi nhiều lần vẫn chỉ một bản ghi
router.put("/:slug/favorite", requireAuth, async (req, res, next) => {
  try {
    const destinationId = await findDestinationId(req.params.slug);
    if (!destinationId) return void notFound(res);
    await pool.query(
      `INSERT INTO favorite (user_id, destination_id) VALUES ($1, $2)
       ON CONFLICT (user_id, destination_id) DO NOTHING`,
      [req.user!.userId, destinationId],
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.delete("/:slug/favorite", requireAuth, async (req, res, next) => {
  try {
    const destinationId = await findDestinationId(req.params.slug);
    if (!destinationId) return void notFound(res);
    await pool.query("DELETE FROM favorite WHERE user_id = $1 AND destination_id = $2", [
      req.user!.userId,
      destinationId,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
