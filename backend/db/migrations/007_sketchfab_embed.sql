-- Khung phẳng nhúng mô hình Sketchfab.
-- Chỉ chấp nhận đúng dạng URL embed của Sketchfab, để tránh nhúng trang lạ vào iframe.
ALTER TABLE tourist_destination
  ADD COLUMN embed_url TEXT
    CHECK (embed_url IS NULL OR embed_url ~ '^https://sketchfab\.com/models/[a-f0-9]{32}/embed$'),
  ADD COLUMN embed_credit VARCHAR(500);

UPDATE tourist_destination
SET embed_url = 'https://sketchfab.com/models/3c5b7197d73342bbb333b24be23ba850/embed',
    embed_credit = 'Colosseum, Roman Forum, Rome, Italy by LibanCiel on Sketchfab'
WHERE slug = 'colosseum';
