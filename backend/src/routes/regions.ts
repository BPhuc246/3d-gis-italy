import { Router } from 'express';
import { pool } from '../db/pool';
import { isSlug } from '../lib/validate';

const router = Router();

// Khu vực bản đồ kèm công trình và số liệu dựng hình
router.get('/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!isSlug(slug)) {
      res.status(404).json({ message: 'Không tìm thấy khu vực' });
      return;
    }

    const { rows: regionRows } = await pool.query(
      `SELECT region_id AS "regionId", slug, name, description,
              center_latitude AS "centerLatitude", center_longitude AS "centerLongitude"
       FROM map_region WHERE slug = $1`,
      [slug]
    );
    const region = regionRows[0];
    if (!region) {
      res.status(404).json({ message: 'Không tìm thấy khu vực' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT d.slug, d.name, d.description, d.address, d.category,
              c.label AS "categoryLabel", d.latitude, d.longitude,
              d.cover_image_url AS "coverImageUrl", d.opening_hours AS "openingHours",
              d.entry_fee::float8 AS "entryFee", d.entry_fee_currency AS "entryFeeCurrency",
              d.building_shape AS "buildingShape",
              d.footprint_length_m::float8 AS "footprintLengthM",
              d.footprint_width_m::float8 AS "footprintWidthM",
              d.height_m::float8 AS "heightM",
              d.heading_deg AS "headingDeg",
              d.interior_height_m::float8 AS "interiorHeightM",
              d.display_color AS "displayColor",
              (SELECT COALESCE(json_agg(json_build_object(
                  'kind', e.kind, 'embedUrl', e.embed_url, 'credit', e.credit
                ) ORDER BY e.sort_order), '[]'::json)
               FROM destination_embed e WHERE e.destination_id = d.destination_id) AS embeds,
              (SELECT ROUND(AVG(r.rating)::numeric, 1)::float8 FROM review r
                WHERE r.destination_id = d.destination_id) AS "avgRating",
              (SELECT COUNT(*)::int FROM review r
                WHERE r.destination_id = d.destination_id) AS "reviewCount"
       FROM tourist_destination d
       JOIN destination_category c ON c.code = d.category
       WHERE d.region_id = $1
       ORDER BY d.name`,
      [region.regionId]
    );

    res.json({ ...region, destinations: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
