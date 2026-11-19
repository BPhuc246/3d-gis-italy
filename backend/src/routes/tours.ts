import { Router } from "express";
import { pool } from "../db/pool";
import { COVER_URL_SQL } from "../lib/destination-data";
import { isSlug } from "../lib/validate";

const router = Router();
const NOT_FOUND = "Không có tour cho địa điểm này";
const LINK_TEXT = "Chuyển góc nhìn; có điểm nối để quay lại ảnh này.";

const imageUrl = (id: string | null) => (id ? `/api/assets/${id}` : null);
const thumbUrl = (id: string | null) => (id ? `/api/assets/${id}/thumb` : null);

// Danh sách tour
router.get("/tours", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.external_id AS id, t.title, d.slug, d.name,
              (SELECT COUNT(*)::int FROM tour_scene s WHERE s.tour_id = t.tour_id) AS "sceneCount",
              ${COVER_URL_SQL} AS "coverUrl"
       FROM tour t
       JOIN tourist_destination d ON d.destination_id = t.destination_id
       ORDER BY d.name`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Toàn bộ tour của một địa điểm, đúng cấu trúc frontend đang dùng
router.get("/destinations/:slug/tour", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!isSlug(slug)) return void res.status(404).json({ message: NOT_FOUND });

    const { rows: [tour] } = await pool.query(
      `SELECT t.tour_id AS "tourId", t.external_id AS id, t.version,
              d.slug AS "destinationSlug", d.name AS "destinationName", t.title,
              t.route_note AS "routeNote", t.start_scene_id AS "startSceneId"
       FROM tour t
       JOIN tourist_destination d ON d.destination_id = t.destination_id
       WHERE d.slug = $1`,
      [slug],
    );
    if (!tour) return void res.status(404).json({ message: NOT_FOUND });

    const [sources, scenes, hotspots, questions, choices] = await Promise.all([
      pool.query(
        "SELECT title, url FROM tour_source WHERE tour_id = $1 ORDER BY sort_order",
        [tour.tourId],
      ),
      pool.query(
        `SELECT s.scene_id AS "sceneId", s.scene_key AS id, s.title, s.description,
                s.alt_text AS alt,
                img.asset_id AS "imageAssetId", thumb.asset_id AS "thumbAssetId",
                a.width, a.height, a.author, a.license, a.license_url AS "licenseUrl",
                a.source_url AS "sourceUrl", a.capture_date_text AS "captureDate"
         FROM tour_scene s
         JOIN destination_image img ON img.scene_id = s.scene_id AND img.image_kind = 'scene'
         LEFT JOIN destination_image thumb ON thumb.scene_id = s.scene_id AND thumb.image_kind = 'thumbnail'
         JOIN media_asset a ON a.asset_id = img.asset_id
         WHERE s.tour_id = $1
         ORDER BY s.sort_order`,
        [tour.tourId],
      ),
      pool.query(
        `SELECT h.scene_id AS "sceneId", h.hotspot_key AS id, h.kind,
                h.x_percent::float8 AS x, h.y_percent::float8 AS y, h.title,
                COALESCE(h.body, CASE WHEN h.kind = 'navigate' THEN $2 END) AS text,
                h.source_url AS "sourceUrl", t.scene_key AS target,
                h.direction, h.sort_order AS "sortOrder"
         FROM scene_hotspot h
         JOIN tour_scene s ON s.scene_id = h.scene_id
         LEFT JOIN tour_scene t ON t.scene_id = h.target_scene_id
         WHERE s.tour_id = $1
         ORDER BY h.sort_order`,
        [tour.tourId, LINK_TEXT],
      ),
      pool.query(
        `SELECT q.question_id AS "questionId", q.question_key AS id, q.prompt,
                q.explanation, s.scene_key AS "sceneId"
         FROM tour_question q
         LEFT JOIN tour_scene s ON s.scene_id = q.scene_id
         WHERE q.tour_id = $1
         ORDER BY q.sort_order`,
        [tour.tourId],
      ),
      pool.query(
        `SELECT c.question_id AS "questionId", c.label, c.position,
                c.is_correct AS "isCorrect"
         FROM question_choice c
         JOIN tour_question q ON q.question_id = c.question_id
         WHERE q.tour_id = $1
         ORDER BY c.question_id, c.position`,
        [tour.tourId],
      ),
    ]);

    const sceneRows = scenes.rows;
    const scenesOut = sceneRows.map((s) => ({
      id: s.id,
      title: s.title,
      image: imageUrl(s.imageAssetId),
      thumbnail: thumbUrl(s.thumbAssetId),
      alt: s.alt,
      description: s.description,
      author: s.author,
      sourceUrl: s.sourceUrl,
      license: s.license,
      licenseUrl: s.licenseUrl,
      width: s.width,
      height: s.height,
      captureDate: s.captureDate,
      hotspots: hotspots.rows
        .filter((h) => h.sceneId === s.sceneId)
        .map((h) =>
          h.target
            ? { id: h.id, x: h.x, y: h.y, title: h.title, text: h.text, target: h.target, direction: h.direction }
            : { id: h.id, x: h.x, y: h.y, title: h.title, text: h.text, sourceUrl: h.sourceUrl },
        ),
    }));

    const questionsOut = questions.rows.map((q) => {
      const opts = choices.rows.filter((c) => c.questionId === q.questionId);
      const answer = opts.findIndex((c) => c.isCorrect);
      return {
        id: q.id,
        prompt: q.prompt,
        choices: opts.map((c) => c.label),
        answer: answer === -1 ? null : answer,
        explanation: q.explanation,
        sceneId: q.sceneId,
      };
    });

    res.json({
      id: tour.id,
      version: tour.version,
      destinationSlug: tour.destinationSlug,
      destinationName: tour.destinationName,
      title: tour.title,
      routeNote: tour.routeNote,
      startSceneId:
        sceneRows.find((s) => s.sceneId === tour.startSceneId)?.id ?? sceneRows[0]?.id ?? null,
      contentSources: sources.rows,
      scenes: scenesOut,
      questions: questionsOut,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
