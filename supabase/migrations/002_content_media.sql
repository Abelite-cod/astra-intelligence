-- ============================================================
-- Migration 002: Content Media System
-- Run in Supabase SQL Editor
-- ============================================================

-- ── content_media table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  brand_id      UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  type          TEXT NOT NULL DEFAULT 'uploaded',   -- uploaded | generated
  storage_path  TEXT NOT NULL,                       -- Supabase Storage path
  public_url    TEXT NOT NULL,                       -- public CDN URL
  prompt        TEXT,                                -- null for uploaded; set for generated
  alt_text      TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  selected      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_media_content ON content_media(content_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_content_media_brand ON content_media(brand_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE content_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_content_media" ON content_media
  FOR ALL TO authenticated
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE org_id = auth.uid()));

-- ── Storage bucket: content-media ────────────────────────────
-- Run this AFTER creating the bucket in Supabase Dashboard → Storage

INSERT INTO storage.buckets (id, name, public)
VALUES ('content-media', 'content-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to content-media bucket
CREATE POLICY "authenticated upload content-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'content-media');

-- Public read for content-media (images served publicly)
CREATE POLICY "public read content-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-media');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "authenticated delete content-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'content-media');
