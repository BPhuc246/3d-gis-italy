import { pool } from "../db/pool";
import { ASSET_BASE, publicUrl } from "./public-url";

// Escape dấu nháy đơn để chèn an toàn vào chuỗi SQL
const SQL_ASSET_BASE = ASSET_BASE.replace(/'/g, "''");

// Trả về URL tuyệt đối, ví dụ https://threed-gis-italy-backend.onrender.com/api/assets/<id>
export const COVER_URL_SQL = `CASE WHEN d.cover_asset_id IS NULL THEN NULL
  ELSE '${SQL_ASSET_BASE}/api/assets/' || d.cover_asset_id END`;

// Tham số khối Three.js (không lưu mesh); NULL khi địa điểm không có khối
export const BUILDING_SQL = `CASE WHEN d.building_shape IS NULL THEN NULL ELSE
  json_build_object(
    'shapeType', d.building_shape,
    'headingDeg', d.heading_deg,
    'heightM', d.height_m::float8,
    'footprintLengthM', d.footprint_length_m::float8,
    'footprintWidthM', d.footprint_width_m::float8
  ) END AS building`;

export async function findDestinationId(slug: string): Promise<string | null> {
  const { rows } = await pool.query<{ destination_id: string }>(
    "SELECT destination_id FROM tourist_destination WHERE slug = $1",
    [slug],
  );
  return rows[0]?.destination_id ?? null;
}

export type ModelOut = {
  modelId: string;
  kind: "exterior" | "interior";
  embedUrl: string;
  credit: string | null;
};

export type GalleryImage = {
  url: string;
  caption: string | null;
  isPrimary: boolean;
};

export async function loadModels(
  ids: string[],
): Promise<Map<string, ModelOut[]>> {
  const map = new Map<string, ModelOut[]>();
  if (ids.length === 0) return map;
  const { rows } = await pool.query<ModelOut & { destinationId: string }>(
    `SELECT destination_id AS "destinationId", model_id AS "modelId", kind,
            storage_path AS "embedUrl", credit
     FROM model_3d
     WHERE destination_id = ANY($1::uuid[])
     ORDER BY destination_id, kind`,
    [ids],
  );
  for (const { destinationId, ...model } of rows) {
    map.set(destinationId, [...(map.get(destinationId) ?? []), model]);
  }
  return map;
}

export async function loadGallery(
  ids: string[],
): Promise<Map<string, GalleryImage[]>> {
  const map = new Map<string, GalleryImage[]>();
  if (ids.length === 0) return map;
  const { rows } = await pool.query<GalleryImage & { destinationId: string }>(
    `SELECT i.destination_id AS "destinationId", '/api/assets/' || i.asset_id AS url,
            i.caption, i.is_primary AS "isPrimary"
     FROM destination_image i
     WHERE i.image_kind = 'scene' AND i.destination_id = ANY($1::uuid[])
     ORDER BY i.destination_id, i.is_primary DESC, i.sort_order`,
    [ids],
  );
  for (const { destinationId, ...img } of rows) {
    map.set(destinationId, [
      ...(map.get(destinationId) ?? []),
      { ...img, url: publicUrl(img.url) ?? "" },
    ]);
  }
  return map;
}
