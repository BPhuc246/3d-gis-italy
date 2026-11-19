import { Router } from "express";
import { pool } from "../db/pool";
import { COVER_URL_SQL } from "../lib/destination-data";
import { isUuid } from "../lib/validate";

const router = Router();

// Danh sách tuyến
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.route_id AS "routeId", r.name, r.description,
              ROUND((r.total_distance_m / 1000)::numeric, 2)::float8 AS "totalDistanceKm",
              r.estimated_duration_min AS "estimatedDurationMinutes",
              COUNT(s.route_stop_id)::int AS "stopCount"
       FROM tour_route r
       LEFT JOIN route_stop s ON s.route_id = r.route_id
       GROUP BY r.route_id
       ORDER BY r.name`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Chi tiết tuyến: đường đi GeoJSON (route_line) và các điểm dừng theo thứ tự
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isUuid(id)) return void res.status(404).json({ message: "Không tìm thấy tuyến" });

    const { rows: [route] } = await pool.query(
      `SELECT route_id AS "routeId", name, description,
              ROUND((total_distance_m / 1000)::numeric, 2)::float8 AS "totalDistanceKm",
              estimated_duration_min AS "estimatedDurationMinutes",
              CASE WHEN route_line IS NULL THEN NULL ELSE ST_AsGeoJSON(route_line)::json END AS path
       FROM tour_route WHERE route_id = $1`,
      [id],
    );
    if (!route) return void res.status(404).json({ message: "Không tìm thấy tuyến" });

    const { rows: stops } = await pool.query(
      `SELECT s.stop_order AS "stopOrder", s.stay_duration_min AS "stayMinutes",
              d.slug, d.name, d.address,
              ST_Y(d.location::geometry) AS latitude, ST_X(d.location::geometry) AS longitude,
              ${COVER_URL_SQL} AS "coverUrl",
              COALESCE(d.category_label, d.category) AS "categoryLabel"
       FROM route_stop s
       JOIN tourist_destination d ON d.destination_id = s.destination_id
       WHERE s.route_id = $1
       ORDER BY s.stop_order`,
      [id],
    );

    res.json({ ...route, stops });
  } catch (err) {
    next(err);
  }
});

export default router;
