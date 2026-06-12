-- Sprint 64: cover image support for pengumuman feed (16:9, URL or data URI)
ALTER TABLE pengumuman
  ADD COLUMN IF NOT EXISTS cover_url TEXT NULL;
