#!/usr/bin/env node
// db/seed/load-local-data.mjs
// Nạp dữ liệu từ _local/ vào PostgreSQL. Chạy từ thư mục gốc dự án:
//   DB_POSTGRES=postgres://user:pass@localhost:5432/roma_heritage node db/seed/load-local-data.mjs
// Biến tùy chọn: LOCAL_DIR (mặc định <gốc>/_local)

import "dotenv/config";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LOCAL_DIR = path.resolve(process.env.LOCAL_DIR ?? path.join(ROOT, "../_local"));
const DB_URL = process.env.DB_POSTGRES;

if (!DB_URL) {
  console.error("Thiếu biến môi trường DB_POSTGRES");
  process.exit(1);
}

// Khối công trình dựng bằng Three.js: chỉ lưu tham số, không lưu mesh.
// Tọa độ là tâm công trình đã căn chỉnh theo OSM (thay cho tọa độ POI).
const BUILDINGS = {
  colosseum: { lon: 12.49235546, lat: 41.89025632, shape: "ellipse", length: 189.53, width: 141.53, height: 48, heading: 19.95 },
  "arch-of-constantine": { lon: 12.490666775, lat: 41.889762225, shape: "rectangle", length: 25.4, width: 6.95, height: 21, heading: 13 },
  pantheon: { lon: 12.47683457, lat: 41.89855333, shape: "circle", length: 55.3, width: 55.3, height: 43.3, heading: 356.5 },
  vittoriano: { lon: 12.48312, lat: 41.89465, shape: "rectangle", length: 138, width: 170, height: 81, heading: 343 },
};

const warnings = [];
const warn = (msg) => {
  warnings.push(msg);
  console.warn(`⚠️  ${msg}`);
};

const readJson = async (name) => JSON.parse(await fs.readFile(path.join(LOCAL_DIR, name), "utf8"));
const readOptionalJson = async (name) =>
  existsSync(path.join(LOCAL_DIR, name)) ? readJson(name) : null;

// "/_local/images/x.jpg" -> "images/x.jpg"
const rel = (p) => (p ?? "").replace(/^\/?_local\//, "") || null;

// "2011-09-28 18:31" -> "2011-09-28"
const isoDate = (s) =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;

// Upsert tổng quát theo cột xung đột
async function upsert(client, table, conflict, row, returning) {
  const cols = Object.keys(row);
  const sets = cols
    .filter((c) => c !== conflict)
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(", ");
  const sql = `INSERT INTO ${table} (${cols.join(", ")})
    VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})
    ON CONFLICT (${conflict}) DO UPDATE SET ${sets}
    RETURNING ${returning}`;
  const { rows } = await client.query(sql, Object.values(row));
  return rows[0][returning];
}

async function upsertRegion(client, r) {
  const { rows } = await client.query(
    `INSERT INTO region (slug, name, description, center)
     VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name, description = EXCLUDED.description, center = EXCLUDED.center
     RETURNING region_id`,
    [r.slug, r.name, r.description ?? null, r.centerLongitude, r.centerLatitude],
  );
  return rows[0].region_id;
}

// Tạo hoặc cập nhật một media_asset; đọc file để lấy sha256 và dung lượng thật
async function upsertAsset(client, meta) {
  const abs = path.join(LOCAL_DIR, meta.storage_path);
  let sha = meta.sha256 ?? null;
  let bytes = meta.file_bytes ?? null;

  if (existsSync(abs)) {
    const buf = await fs.readFile(abs);
    const real = crypto.createHash("sha256").update(buf).digest("hex");
    if (sha && sha !== real) warn(`SHA256 không khớp sources.json: ${meta.storage_path}`);
    sha = real;
    bytes = buf.length;
  } else {
    warn(`Không tìm thấy file ảnh: ${meta.storage_path}`);
  }
  if (meta.thumbnail_path && !existsSync(path.join(LOCAL_DIR, meta.thumbnail_path))) {
    warn(`Không tìm thấy thumbnail: ${meta.thumbnail_path}`);
  }

  return upsert(
    client,
    "media_asset",
    "storage_path",
    { ...meta, sha256: sha, file_bytes: bytes },
    "asset_id",
  );
}

// Map: storage_path -> asset_id
async function loadAssets(client, sources, titles) {
  const map = new Map();
  for (const s of sources) {
    const key = rel(s.file);
    const id = await upsertAsset(client, {
      storage_path: key,
      thumbnail_path: rel(s.thumbnail),
      original_title: s.title ?? titles[path.basename(key)] ?? null,
      author: s.author ?? null,
      author_html: s.artistHtml ?? null,
      source_url: s.sourceUrl ?? null,
      download_url: s.downloadUrl ?? null,
      license: s.license,
      license_url: s.licenseUrl ?? null,
      width: s.width ?? null,
      height: s.height ?? null,
      capture_date_text: s.captureDate ?? null,
      capture_date: isoDate(s.captureDate),
      description: s.description ?? null,
      sha256: s.sha256 ?? null,
      file_bytes: s.bytes ?? null,
    });
    map.set(key, id);
  }
  return map;
}

// Ảnh của scene không có trong sources.json: tạo asset từ metadata của chính scene
async function resolveSceneAsset(client, assets, sc, titles) {
  const key = rel(sc.image);
  if (assets.has(key)) return assets.get(key);

  warn(`Ảnh ${key} không có trong sources.json, dùng metadata của scene`);
  const id = await upsertAsset(client, {
    storage_path: key,
    thumbnail_path: rel(sc.thumbnail),
    original_title: titles[path.basename(key)] ?? null,
    author: sc.author ?? null,
    source_url: sc.sourceUrl ?? null,
    license: sc.license ?? "Không rõ",
    license_url: sc.licenseUrl ?? null,
    width: sc.width ?? null,
    height: sc.height ?? null,
    capture_date_text: sc.captureDate ?? null,
    capture_date: isoDate(sc.captureDate),
    description: sc.description ?? null,
  });
  assets.set(key, id);
  return id;
}

async function loadDestinations(client, region, regionId, assets) {
  const ids = new Map();
  for (const d of region.destinations) {
    const b = BUILDINGS[d.slug] ?? null;
    const coverKey = rel(d.coverImageUrl);
    const cover = coverKey ? (assets.get(coverKey) ?? null) : null;
    if (coverKey && !cover) warn(`Ảnh bìa ${coverKey} của ${d.slug} không có trong assets`);

    const id = await upsert(
      client,
      "tourist_destination",
      "slug",
      {
        region_id: regionId,
        slug: d.slug,
        name: d.name,
        description: d.description,
        address: d.address,
        category: d.category,
        category_label: d.categoryLabel ?? null,
        latitude: b?.lat ?? d.latitude,
        longitude: b?.lon ?? d.longitude,
        opening_hours: d.openingHours ?? null,
        entry_fee: d.entryFee ?? null,
        entry_fee_currency: d.entryFeeCurrency ?? "EUR",
        building_shape: b?.shape ?? null,
        footprint_length_m: b?.length ?? null,
        footprint_width_m: b?.width ?? null,
        height_m: b?.height ?? null,
        heading_deg: b ? Math.round(b.heading) % 360 : null,
        display_color: d.displayColor ?? null,
        cover_asset_id: cover,
        arcgis_scene_item_id: d.arcgisSceneItemId ?? null,
      },
      "destination_id",
    );
    ids.set(d.slug, id);
  }
  return ids;
}

// Chỉ lưu mô hình Sketchfab (đường dẫn embed nằm trong storage_path vì schema không có cột riêng)
async function loadModels(client, region, destIds) {
  for (const d of region.destinations) {
    const destId = destIds.get(d.slug);
    await client.query("DELETE FROM model_3d WHERE destination_id = $1", [destId]);
    for (const e of d.embeds ?? []) {
      if (!/^https:\/\/sketchfab\.com\//.test(e.embedUrl ?? "")) {
        warn(`Bỏ qua embed không phải Sketchfab của ${d.slug}`);
        continue;
      }
      await client.query(
        `INSERT INTO model_3d (destination_id, kind, storage_path, mime_type, credit)
         VALUES ($1, $2, $3, 'text/html', $4)`,
        [destId, e.kind, e.embedUrl, e.credit ?? null],
      );
    }
  }
}

async function loadRoutes(client, routes, destIds) {
  if (!routes) return;
  await client.query("DELETE FROM tour_route"); // route_stop xóa theo (CASCADE)
  for (const r of routes) {
    const { rows } = await client.query(
      `INSERT INTO tour_route (name, description, estimated_duration_min)
       VALUES ($1, $2, $3) RETURNING route_id`,
      [r.name, r.description ?? "", r.estimatedDurationMinutes ?? null],
    );
    for (const [i, s] of (r.stops ?? []).entries()) {
      const destId = destIds.get(s.slug);
      if (!destId) throw new Error(`Tuyến "${r.name}" có điểm dừng không tồn tại: ${s.slug}`);
      await client.query(
        `INSERT INTO route_stop (route_id, destination_id, stop_order, stay_duration_min)
         VALUES ($1, $2, $3, $4)`,
        [rows[0].route_id, destId, s.stopOrder ?? i + 1, s.stayMinutes ?? null],
      );
    }
  }
}

async function loadTour(client, t, destId, assets, titles) {
  const { rows: [tour] } = await client.query(
    `INSERT INTO tour (destination_id, external_id, version, title, route_note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (destination_id) DO UPDATE SET
       external_id = EXCLUDED.external_id, version = EXCLUDED.version,
       title = EXCLUDED.title, route_note = EXCLUDED.route_note
     RETURNING tour_id`,
    [destId, t.id, t.version ?? 1, t.title, t.routeNote ?? null],
  );
  const tid = tour.tour_id;

  // Xóa nội dung cũ; scene xóa kéo theo hotspot và destination_image, câu hỏi kéo theo lựa chọn
  await client.query("DELETE FROM tour_question WHERE tour_id = $1", [tid]);
  await client.query("DELETE FROM tour_source WHERE tour_id = $1", [tid]);
  await client.query("DELETE FROM tour_scene WHERE tour_id = $1", [tid]);

  for (const [i, s] of (t.contentSources ?? []).entries()) {
    await client.query(
      "INSERT INTO tour_source (tour_id, sort_order, title, url) VALUES ($1, $2, $3, $4)",
      [tid, i + 1, s.title, s.url],
    );
  }

  const sceneIds = new Map();
  for (const [i, sc] of t.scenes.entries()) {
    const { rows: [row] } = await client.query(
      `INSERT INTO tour_scene (tour_id, scene_key, sort_order, title, description, alt_text)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING scene_id`,
      [tid, sc.id, i + 1, sc.title, sc.description ?? null, sc.alt ?? null],
    );
    sceneIds.set(sc.id, row.scene_id);

    const assetId = await resolveSceneAsset(client, assets, sc, titles);
    const isPrimary = sc.id === t.startSceneId;
    for (const kind of ["scene", "thumbnail"]) {
      await client.query(
        `INSERT INTO destination_image
           (destination_id, scene_id, asset_id, image_kind, sort_order, is_primary, alt_text, caption)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [destId, row.scene_id, assetId, kind, i + 1, isPrimary && kind === "scene", sc.alt ?? null, sc.title],
      );
    }
  }

  for (const sc of t.scenes) {
    const sceneId = sceneIds.get(sc.id);
    for (const [i, h] of (sc.hotspots ?? []).entries()) {
      const nav = "target" in h;
      const targetId = nav ? sceneIds.get(h.target) : null;
      if (nav && !targetId)
        throw new Error(`Hotspot ${t.id}/${sc.id}/${h.id} trỏ tới scene không tồn tại: ${h.target}`);
      await client.query(
        `INSERT INTO scene_hotspot
           (scene_id, hotspot_key, kind, x_percent, y_percent, title, body, source_url,
            target_scene_id, direction, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          sceneId, h.id, nav ? "navigate" : "info", h.x, h.y, h.title,
          h.text ?? null, h.sourceUrl ?? null, targetId, nav ? h.direction : null, i + 1,
        ],
      );
    }
  }

  if (t.startSceneId && sceneIds.has(t.startSceneId)) {
    await client.query("UPDATE tour SET start_scene_id = $1 WHERE tour_id = $2", [
      sceneIds.get(t.startSceneId),
      tid,
    ]);
  }

  for (const [i, q] of (t.questions ?? []).entries()) {
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length)
      throw new Error(`Câu hỏi ${q.id} có answer không hợp lệ: ${q.answer}`);
    if (q.sceneId && !sceneIds.has(q.sceneId))
      throw new Error(`Câu hỏi ${q.id} trỏ tới scene không tồn tại: ${q.sceneId}`);

    const { rows: [qr] } = await client.query(
      `INSERT INTO tour_question (tour_id, question_key, sort_order, scene_id, prompt, explanation)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING question_id`,
      [tid, q.id, i + 1, q.sceneId ? sceneIds.get(q.sceneId) : null, q.prompt, q.explanation ?? null],
    );
    for (const [pos, label] of q.choices.entries()) {
      await client.query(
        `INSERT INTO question_choice (question_id, position, label, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [qr.question_id, pos, label, pos === q.answer],
      );
    }
  }
}

// Mỗi file *-tour.json là một tour; địa điểm lấy từ trường destinationSlug
async function loadTours(client, destIds, assets, titles) {
  const files = (await fs.readdir(LOCAL_DIR)).filter((f) => f.endsWith("-tour.json")).sort();
  if (files.length === 0) warn("Không tìm thấy file *-tour.json");
  for (const file of files) {
    const t = JSON.parse(await fs.readFile(path.join(LOCAL_DIR, file), "utf8"));
    const destId = destIds.get(t.destinationSlug);
    if (!destId) throw new Error(`${file}: destinationSlug không có trong region.json: ${t.destinationSlug}`);
    await loadTour(client, t, destId, assets, titles);
  }
  return files.length;
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query("BEGIN");

    const region = await readJson("region.json");
    const sources = await readJson("sources.json");
    const titles = await readJson("tour-assets.json");
    const routes = await readOptionalJson("routes.json");
    if (!routes) warn("Không có routes.json: giữ nguyên tour_route hiện tại");

    const regionId = await upsertRegion(client, region);
    const assets = await loadAssets(client, sources, titles);
    const destIds = await loadDestinations(client, region, regionId, assets);
    await loadModels(client, region, destIds);
    await loadRoutes(client, routes, destIds);
    const tourCount = await loadTours(client, destIds, assets, titles);

    await client.query("COMMIT");
    console.log(
      `\n✅ Nạp dữ liệu thành công: ${region.destinations.length} địa điểm, ${tourCount} tour, ${routes?.length ?? 0} tuyến`,
    );
    console.log(`   • Cảnh báo: ${warnings.length}`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("\n❌ Lỗi, đã rollback toàn bộ:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
