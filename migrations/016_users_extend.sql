-- 016_users_extend.sql
-- Kolom operasional untuk GET/POST/PUT /users (userRoutes.js)
-- Idempotent — aman dijalankan ulang.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Backfill baris lama
UPDATE users
SET status = 'active'
WHERE status IS NULL;

UPDATE users
SET created_at = NOW()
WHERE created_at IS NULL;
