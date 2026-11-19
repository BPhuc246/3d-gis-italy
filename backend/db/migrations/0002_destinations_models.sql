-- 0002: tourist_destination, model_3d
BEGIN;

CREATE TABLE tourist_destination (
  destination_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id            uuid NOT NULL REFERENCES region(region_id) ON DELETE CASCADE,
  slug                 varchar(100) NOT NULL UNIQUE,
  name                 varchar(255) NOT NULL,
  description          text NOT NULL,
  address              varchar(500) NOT NULL,
  category             varchar(100) NOT NULL,
  category_label       varchar(100),
  latitude             double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude            double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location             geography(Point, 4326) NOT NULL
                         GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  opening_hours        varchar(255),
  entry_fee            numeric(12,2) CHECK (entry_fee >= 0),
  entry_fee_currency   char(3) NOT NULL DEFAULT 'EUR',
  building_shape       varchar(20) CHECK (building_shape IN ('ellipse', 'rectangle', 'circle')),
  footprint_length_m   numeric(8,2) CHECK (footprint_length_m > 0),
  footprint_width_m    numeric(8,2) CHECK (footprint_width_m > 0),
  height_m             numeric(8,2) CHECK (height_m > 0),
  heading_deg          smallint CHECK (heading_deg BETWEEN 0 AND 360),
  display_color        char(7) CHECK (display_color ~ '^#[0-9A-Fa-f]{6}$'),
  cover_asset_id       uuid REFERENCES media_asset(asset_id) ON DELETE SET NULL,
  arcgis_scene_item_id varchar(100),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_destination_location ON tourist_destination USING GIST (location);
CREATE INDEX idx_destination_region   ON tourist_destination (region_id);
CREATE INDEX idx_destination_category ON tourist_destination (category);

CREATE TYPE model_kind AS ENUM ('exterior', 'interior');

-- Một địa điểm có thể có nhiều mô hình 3D, mỗi loại tối đa một file
CREATE TABLE model_3d (
  model_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  kind           model_kind NOT NULL,
  storage_path   text NOT NULL UNIQUE,            -- ví dụ: pantheon/interior.glb (tương đối với db/models)
  mime_type      varchar(100) NOT NULL DEFAULT 'model/gltf-binary',
  file_bytes     bigint CHECK (file_bytes >= 0),
  sha256         char(64),
  credit         text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_model_destination_kind UNIQUE (destination_id, kind)
);

COMMIT;