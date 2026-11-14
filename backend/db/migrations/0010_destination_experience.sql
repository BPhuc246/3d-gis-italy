-- Video và âm thanh cho trải nghiệm (cảnh 3D dựng bằng code nên không cần file mô hình)
CREATE TABLE IF NOT EXISTS destination_experience (
  experience_id  SERIAL PRIMARY KEY,
  destination_id UUID NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  feature_key    VARCHAR(60) NOT NULL CHECK (feature_key ~ '^[a-z0-9_]+$'),
  kind           VARCHAR(20) NOT NULL CHECK (kind IN ('video', 'audio')),
  asset_url      TEXT NOT NULL CHECK (asset_url ~ '^(/|https://)'),
  license        VARCHAR(120) NOT NULL,
  credit         VARCHAR(500),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_experience_feature UNIQUE (destination_id, feature_key)
);

-- Nến tưởng niệm (chỉ Pantheon và Vittoriano, kiểm tra ở tầng router)
CREATE TABLE IF NOT EXISTS memorial_candle (
  candle_id      BIGSERIAL PRIMARY KEY,
  destination_id UUID NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lit_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_memorial_candle_dest_user
  ON memorial_candle (destination_id, user_id, lit_at);

-- Ví dụ dữ liệu (thay đường dẫn và credit bằng tài nguyên thật)
INSERT INTO destination_experience (destination_id, feature_key, kind, asset_url, license, credit, sort_order)
SELECT destination_id, 'intro_video', 'video', '/_local/videos/colosseum-intro.mp4', 'Tự quay', 'Đội dự án', 0
FROM tourist_destination WHERE slug = 'colosseum'
ON CONFLICT (destination_id, feature_key) DO NOTHING;

INSERT INTO destination_experience (destination_id, feature_key, kind, asset_url, license, credit, sort_order)
SELECT destination_id, 'crowd_audio', 'audio', '/audio/colosseum-crowd.ogg', 'CC0', 'Tên người đăng trên Freesound', 1
FROM tourist_destination WHERE slug = 'colosseum'
ON CONFLICT (destination_id, feature_key) DO NOTHING;