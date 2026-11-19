-- 0001: PostGIS, hàm dùng chung, region, media_asset
BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TABLE region (
  region_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         varchar(100) NOT NULL UNIQUE,
  name         varchar(255) NOT NULL,
  description  text,
  center       geography(Point, 4326) NOT NULL,
  boundary     geography(Polygon, 4326),          -- ranh giới vùng (tùy chọn)
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_region_center   ON region USING GIST (center);
CREATE INDEX idx_region_boundary ON region USING GIST (boundary);

-- Mỗi file ảnh gốc là một asset, kèm đường dẫn thumbnail và metadata bản quyền
CREATE TABLE media_asset (
  asset_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path      text NOT NULL UNIQUE,         -- images/colosseum-exterior.jpg
  thumbnail_path    text,                         -- images/thumbs/colosseum-exterior.jpg
  original_title    text,
  author            text,
  author_html       text,
  source_url        text,
  download_url      text,
  license           varchar(100) NOT NULL,
  license_url       text,
  width             integer CHECK (width > 0),
  height            integer CHECK (height > 0),
  capture_date_text varchar(100),                 -- giữ nguyên chuỗi gốc
  capture_date      date,                         -- chỉ có khi parse được
  description       text,
  file_bytes        bigint CHECK (file_bytes >= 0),
  sha256            char(64),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_asset_sha256 ON media_asset (sha256);

COMMIT;