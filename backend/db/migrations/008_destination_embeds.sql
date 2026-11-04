-- Mỗi công trình có tối đa một mô hình nhúng cho mỗi loại: bên ngoài và bên trong
CREATE TABLE destination_embed (
  embed_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES tourist_destination(destination_id) ON DELETE CASCADE,
  kind           VARCHAR(20) NOT NULL CHECK (kind IN ('exterior', 'interior')),
  embed_url      TEXT NOT NULL
    CHECK (embed_url ~ '^https://sketchfab\.com/models/[a-f0-9]{32}/embed$'),
  credit         VARCHAR(500),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_destination_embed_kind UNIQUE (destination_id, kind)
);

-- Chuyển dữ liệu từ migration 007 sang bảng mới
INSERT INTO destination_embed (destination_id, kind, embed_url, credit, sort_order)
SELECT destination_id, 'exterior', embed_url, embed_credit, 0
FROM tourist_destination
WHERE embed_url IS NOT NULL
ON CONFLICT (destination_id, kind) DO NOTHING;

ALTER TABLE tourist_destination
  DROP COLUMN IF EXISTS embed_url,
  DROP COLUMN IF EXISTS embed_credit;

-- Đền Pantheon: bên ngoài và bên trong
INSERT INTO destination_embed (destination_id, kind, embed_url, credit, sort_order)
SELECT destination_id, 'exterior',
       'https://sketchfab.com/models/8ce20ac5fc3a4af7ab223cdc0caa7d27/embed',
       'Pantheon, Rome, Italy by Brian Trepanier on Sketchfab', 0
FROM tourist_destination WHERE slug = 'pantheon'
ON CONFLICT (destination_id, kind) DO NOTHING;

INSERT INTO destination_embed (destination_id, kind, embed_url, credit, sort_order)
SELECT destination_id, 'interior',
       'https://sketchfab.com/models/5f35ab370082403e8c7829388f4e0c30/embed',
       'The Pantheon Interior by artfletch on Sketchfab', 1
FROM tourist_destination WHERE slug = 'pantheon'
ON CONFLICT (destination_id, kind) DO NOTHING;

-- Khải hoàn môn Constantine: bên ngoài
INSERT INTO destination_embed (destination_id, kind, embed_url, credit, sort_order)
SELECT destination_id, 'exterior',
       'https://sketchfab.com/models/ae8471e2f6b94e8591f006c8cfa04c27/embed',
       'Arco de Constantino by Real Academia de Bellas Artes de San Fernando on Sketchfab', 0
FROM tourist_destination WHERE slug = 'arch-of-constantine'
ON CONFLICT (destination_id, kind) DO NOTHING;
