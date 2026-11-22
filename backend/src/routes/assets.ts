import { Router, type NextFunction, type Response } from "express";
import path from "node:path";
import { pool } from "../db/pool";
import { isUuid } from "../lib/validate";

const router = Router();

// Thư mục chứa ảnh gốc (_local). Mặc định: ../_local so với thư mục backend
const ASSET_DIR = path.resolve(
  process.cwd(),
  process.env.ASSET_DIR ?? "_local",
);

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const NOT_FOUND = { message: "Không tìm thấy tệp" };

async function sendAsset(
  res: Response,
  next: NextFunction,
  id: string,
  thumb: boolean,
) {
  try {
    const column = thumb
      ? "COALESCE(thumbnail_path, storage_path)"
      : "storage_path";
    const { rows } = await pool.query<{ p: string | null }>(
      `SELECT ${column} AS p FROM media_asset WHERE asset_id = $1`,
      [id],
    );
    const rel = rows[0]?.p;
    const abs = rel ? path.resolve(ASSET_DIR, rel) : null;
    const type = abs ? MIME[path.extname(abs).toLowerCase()] : undefined;
    if (!abs || !type || !abs.startsWith(ASSET_DIR + path.sep))
      return void res.status(404).json(NOT_FOUND);

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.type(type);
    res.sendFile(abs, (err) => {
      if (err && !res.headersSent) res.status(404).json(NOT_FOUND);
    });
  } catch (err) {
    next(err);
  }
}

router.get("/:id", (req, res, next) => {
  const id = req.params.id;
  if (!isUuid(id)) return void res.status(404).json(NOT_FOUND);
  return sendAsset(res, next, id, false);
});

router.get("/:id/thumb", (req, res, next) => {
  const id = req.params.id;
  if (!isUuid(id)) return void res.status(404).json(NOT_FOUND);
  return sendAsset(res, next, id, true);
});

export default router;
