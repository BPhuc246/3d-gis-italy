import { Router } from 'express';
import { pool } from '../db/pool';
import { isUuid } from '../lib/validate';

const router = Router();

// Danh sách tuyến
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.route_id AS "routeId", t.name, t.description,
              t.total_distance_km::float8 AS "totalDistanceKm",
              t.estimated_duration_minutes AS "estimatedDurationMinutes",
              COUNT(s.route_stop_id)::int AS "stopCount"
       FROM tour_route t
       LEFT JOIN route_stop s ON s.route_id = t.route_id
       GROUP BY t.route_id
       ORDER BY t.name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Chi tiết tuyến kèm điểm dừng
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isUuid(id)) {
      res.status(404).json({ message: 'Không tìm thấy tuyến' });
      return;
    }

    const { rows: routeRows } = await pool.query(
      `SELECT route_id AS "routeId", name, description,
              total_distance_km::float8 AS "totalDistanceKm",
              estimated_duration_minutes AS "estimatedDurationMinutes"
       FROM tour_route WHERE route_id = $1`,
      [id]
    );
    if (!routeRows[0]) {
      res.status(404).json({ message: 'Không tìm thấy tuyến' });
      return;
    }

    const { rows: stops } = await pool.query(
      `SELECT s.stop_order AS "stopOrder", s.stay_minutes AS "stayMinutes",
              d.slug, d.name, d.address, d.latitude, d.longitude
       FROM route_stop s
       JOIN tourist_destination d ON d.destination_id = s.destination_id
       WHERE s.route_id = $1
       ORDER BY s.stop_order`,
      [id]
    );

    res.json({ ...routeRows[0], stops });
  } catch (err) {
    next(err);
  }
});

export default router;
