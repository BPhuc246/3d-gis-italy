import { Router } from "express";
import { pool } from "../db/pool";
import {
  BUILDING_SQL,
  COVER_URL_SQL,
  loadGallery,
  loadModels,
} from "../lib/destination-data";
import { isSlug } from "../lib/validate";

const router = Router();

// Khu vực bản đồ kèm địa điểm, khối công trình, mô hình và ảnh
router.get("/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!isSlug(slug))
      return void res.status(404).json({ message: "Không tìm thấy khu vực" });

    const { rows: [region] } = await pool.query(
      `SELECT region_id AS "regionId", slug, name, description,
              ST_Y(center::geometry) AS "centerLatitude",
              ST_X(center::geometry) AS "centerLongitude",
              CASE WHEN boundary IS NULL THEN NULL ELSE ST_AsGeoJSON(boundary)::json END AS boundary
       FROM region WHERE slug = $1`,
      [slug],
    );
    if (!region)
      return void res.status(404).json({ message: "Không tìm thấy khu vực" });

    const { rows } = await pool.query(
      `SELECT d.destination_id AS "destinationId", d.slug, d.name, d.description, d.address,
              d.category, COALESCE(d.category_label, d.category) AS "categoryLabel",
              ST_Y(d.location::geometry) AS latitude, ST_X(d.location::geometry) AS longitude,
              ${COVER_URL_SQL} AS "coverUrl",
              d.opening_hours AS "openingHours",
              d.entry_fee::float8 AS "entryFee", d.entry_fee_currency AS "entryFeeCurrency",
              d.display_color AS "displayColor",
              ${BUILDING_SQL},
              (SELECT ROUND(AVG(x.rating)::numeric, 1)::float8 FROM review x
                WHERE x.destination_id = d.destination_id) AS "avgRating",
              (SELECT COUNT(*)::int FROM review x
                WHERE x.destination_id = d.destination_id) AS "reviewCount"
       FROM tourist_destination d
       WHERE d.region_id = $1
       ORDER BY d.name`,
      [region.regionId],
    );

    const ids = rows.map((r) => r.destinationId);
    const [models, gallery] = await Promise.all([loadModels(ids), loadGallery(ids)]);

    res.json({
      ...region,
      destinations: rows.map((r) => ({
        ...r,
        models: models.get(r.destinationId) ?? [],
        images: gallery.get(r.destinationId) ?? [],
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
