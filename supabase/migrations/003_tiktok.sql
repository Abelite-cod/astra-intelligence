-- ============================================================
-- Migration 003: TikTok Integration
-- Run in Supabase SQL Editor
-- ============================================================

-- ── tiktok_scripts table (1:1 with content) ──────────────────
CREATE TABLE IF NOT EXISTS tiktok_scripts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id) ON DELETE CASCADE UNIQUE NOT NULL,
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,

  -- Content structure
  hook            TEXT NOT NULL DEFAULT '',
  hook_type       TEXT DEFAULT 'statement',   -- question|statement|statistic|story|challenge
  concept         TEXT NOT NULL DEFAULT '',
  narrative_arc   TEXT DEFAULT 'problem_solution', -- problem_solution|listicle|story|tutorial|reveal
  full_script     TEXT,
  voiceover_text  TEXT,
  on_screen_text  TEXT[] DEFAULT '{}',

  -- Scene-by-scene breakdown (array of JSON objects)
  scenes          JSONB DEFAULT '[]',
  -- Each scene: {order, duration_sec, visual_direction, action, voiceover, text_overlay, transition}

  -- Production
  duration_sec    INT DEFAULT 30,
  format          TEXT DEFAULT 'talking_head',
  -- talking_head|voiceover_broll|text_animation|screen_recording|carousel_video|duet_template
  visual_style    TEXT,
  music_suggestion TEXT,

  -- Publishing fields (caption + hashtags also stored in content table for consistency)
  caption         TEXT,
  hashtags        TEXT[] DEFAULT '{}',
  cta             TEXT,

  -- TikTok publishing settings
  privacy_level   TEXT DEFAULT 'SELF_ONLY',
  -- SELF_ONLY|MUTUAL_FOLLOW_FRIENDS|FOLLOWER_OF_CREATOR|PUBLIC_TO_EVERYONE
  allow_duet      BOOLEAN DEFAULT true,
  allow_stitch    BOOLEAN DEFAULT true,
  allow_comment   BOOLEAN DEFAULT true,

  -- Duet/Stitch specific
  response_type   TEXT,   -- NULL|duet|stitch
  original_video_url TEXT,
  original_creator   TEXT,
  original_claim     TEXT,
  response_angle     TEXT,   -- agree_and_add|respectful_counter|problem_solution|expert_expansion
  duet_reactions     JSONB DEFAULT '[]',  -- [{at_second, reaction_text, facial_expression}]
  stitch_clip_start_sec INT,
  stitch_clip_end_sec   INT,

  -- TikTok API status
  tiktok_upload_id    TEXT,   -- publish_id from inbox upload
  tiktok_video_id     TEXT,   -- final video_id after publish
  upload_status       TEXT DEFAULT 'pending_script',
  -- pending_script|pending_video|uploading|processing|inbox|published|failed
  upload_error        TEXT,

  -- Quality signals
  estimated_hook_score  NUMERIC,  -- Claude's 0-1 estimate
  pattern_match         TEXT[],   -- which tiktok_memory pattern IDs influenced this

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_scripts_content ON tiktok_scripts(content_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_scripts_brand ON tiktok_scripts(brand_id);

ALTER TABLE tiktok_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_tiktok_scripts" ON tiktok_scripts
  FOR ALL TO authenticated
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE org_id = auth.uid()));


-- ── tiktok_memory table (pattern-based brand memory) ─────────
CREATE TABLE IF NOT EXISTS tiktok_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,

  -- Pattern classification
  pattern_type    TEXT NOT NULL,
  -- hook_style|format|topic_cluster|cta_style|duration|audience_signal
  pattern_label   TEXT NOT NULL,

  -- Pattern content (structured JSONB — see architecture doc for shape)
  pattern_data    JSONB NOT NULL DEFAULT '{}',

  -- Trust signals
  confidence      NUMERIC DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),
  source          TEXT DEFAULT 'imported',
  -- imported|learned|manual|performance
  post_count      INT DEFAULT 1,

  -- Performance feedback
  avg_views       INT,
  avg_engagement  NUMERIC,   -- 0-1 engagement rate
  last_feedback_at TIMESTAMPTZ,

  -- State
  is_active       BOOLEAN DEFAULT true,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_memory_brand ON tiktok_memory(brand_id, pattern_type, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_memory_active ON tiktok_memory(brand_id, is_active);

ALTER TABLE tiktok_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_tiktok_memory" ON tiktok_memory
  FOR ALL TO authenticated
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE org_id = auth.uid()));


-- ── tiktok_respond_queue table (duet/stitch opportunities) ───
CREATE TABLE IF NOT EXISTS tiktok_respond_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,

  -- Original video reference
  original_url    TEXT NOT NULL,
  original_video_id TEXT,   -- TikTok video ID extracted from URL
  original_creator TEXT,
  original_caption TEXT,
  original_claim   TEXT,    -- Claude-extracted: what the video claims

  -- Response configuration
  response_type   TEXT NOT NULL CHECK (response_type IN ('duet', 'stitch')),
  response_angle  TEXT,
  user_context    TEXT,

  -- Generated content link
  content_id      UUID REFERENCES content(id),

  -- Status
  status          TEXT DEFAULT 'queued' CHECK (status IN (
                    'queued', 'generating', 'draft', 'approved', 'published', 'skipped'
                  )),

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_queue_brand ON tiktok_respond_queue(brand_id, status);

ALTER TABLE tiktok_respond_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_tiktok_queue" ON tiktok_respond_queue
  FOR ALL TO authenticated
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE org_id = auth.uid()));


-- ── Add TikTok publish tracking to scheduled_posts ───────────
ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS tiktok_publish_id TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_video_id TEXT;
