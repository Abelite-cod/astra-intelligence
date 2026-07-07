-- ============================================================
-- Astra Intelligence — Supabase Migration
-- Run this in your Supabase SQL editor or via supabase db push
-- ============================================================

-- Enable pgvector for future embedding storage in Postgres
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  plan            TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  seats           INT NOT NULL DEFAULT 3,
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS (mirrors Supabase auth.users with extra fields)
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'member',
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BRANDS
-- ============================================================

CREATE TABLE brands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  mission         TEXT,
  vision          TEXT,
  values          TEXT[],
  tone_of_voice   TEXT DEFAULT 'professional',
  target_audience JSONB DEFAULT '{}',
  products        JSONB DEFAULT '[]',
  competitors     JSONB DEFAULT '[]',
  brand_colors    JSONB DEFAULT '{}',
  fonts           JSONB DEFAULT '{}',
  logo_url        TEXT,
  website_url     TEXT,
  industry        TEXT,
  keywords        TEXT[],
  hashtags        TEXT[],
  onboarded       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KNOWLEDGE DOCUMENTS
-- ============================================================

CREATE TABLE knowledge_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'pdf',
  source_url      TEXT,
  file_path       TEXT,
  content_hash    TEXT,
  status          TEXT DEFAULT 'pending',
  chunk_count     INT DEFAULT 0,
  token_count     INT DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KNOWLEDGE CHUNKS
-- ============================================================

CREATE TABLE knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE NOT NULL,
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  content         TEXT NOT NULL,
  chunk_index     INT NOT NULL,
  token_count     INT,
  metadata        JSONB DEFAULT '{}',
  embedding_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================

CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  created_by      UUID REFERENCES users(id),
  name            TEXT NOT NULL,
  goal            TEXT DEFAULT 'awareness',
  description     TEXT,
  target_audience TEXT,
  start_date      DATE,
  end_date        DATE,
  platforms       TEXT[] DEFAULT '{}',
  status          TEXT DEFAULT 'draft',
  ai_strategy     JSONB,
  budget          NUMERIC,
  kpis            JSONB DEFAULT '{}',
  results         JSONB DEFAULT '{}',
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTENT
-- ============================================================

CREATE TABLE content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES users(id),
  type            TEXT NOT NULL DEFAULT 'post',
  platform        TEXT NOT NULL DEFAULT 'linkedin',
  title           TEXT,
  body            TEXT,
  hook            TEXT,
  cta             TEXT,
  hashtags        TEXT[],
  mentions        TEXT[],
  media_urls      TEXT[],
  thumbnail_url   TEXT,
  ai_metadata     JSONB DEFAULT '{}',
  quality_scores  JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'draft',
  version         INT DEFAULT 1,
  parent_id       UUID REFERENCES content(id),
  agent_run_id    UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPROVALS
-- ============================================================

CREATE TABLE approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  reviewer_id     UUID REFERENCES users(id),
  status          TEXT NOT NULL DEFAULT 'pending',
  comment         TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SOCIAL ACCOUNTS
-- ============================================================

CREATE TABLE social_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  platform        TEXT NOT NULL,
  account_id      TEXT NOT NULL,
  account_name    TEXT,
  account_url     TEXT,
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes          TEXT[],
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, platform, account_id)
);

-- ============================================================
-- SCHEDULED POSTS
-- ============================================================

CREATE TABLE scheduled_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  platform        TEXT NOT NULL,
  platform_account_id TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  published_at    TIMESTAMPTZ,
  platform_post_id TEXT,
  status          TEXT DEFAULT 'scheduled',
  error_message   TEXT,
  retry_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- POST ANALYTICS
-- ============================================================

CREATE TABLE post_analytics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id   UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE NOT NULL,
  brand_id            UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  platform            TEXT NOT NULL,
  fetched_at          TIMESTAMPTZ DEFAULT NOW(),
  impressions         BIGINT DEFAULT 0,
  reach               BIGINT DEFAULT 0,
  likes               INT DEFAULT 0,
  comments            INT DEFAULT 0,
  shares              INT DEFAULT 0,
  saves               INT DEFAULT 0,
  clicks              INT DEFAULT 0,
  ctr                 NUMERIC,
  engagement_rate     NUMERIC,
  video_views         INT DEFAULT 0,
  watch_time_sec      INT DEFAULT 0,
  profile_visits      INT DEFAULT 0,
  followers_gained    INT DEFAULT 0,
  raw_data            JSONB DEFAULT '{}'
);

-- ============================================================
-- AGENT RUNS
-- ============================================================

CREATE TABLE agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  campaign_id     UUID REFERENCES campaigns(id),
  triggered_by    UUID REFERENCES users(id),
  workflow_type   TEXT NOT NULL,
  status          TEXT DEFAULT 'running',
  input           JSONB DEFAULT '{}',
  output          JSONB DEFAULT '{}',
  agent_trace     JSONB DEFAULT '[]',
  tokens_used     INT DEFAULT 0,
  cost_usd        NUMERIC DEFAULT 0,
  duration_ms     INT,
  langfuse_trace_id TEXT,
  error_message   TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ============================================================
-- TREND REPORTS
-- ============================================================

CREATE TABLE trend_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  report_date     DATE DEFAULT CURRENT_DATE,
  trends          JSONB DEFAULT '[]',
  competitor_moves JSONB DEFAULT '[]',
  opportunities   JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  status          TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BRAND MEMORY
-- ============================================================

CREATE TABLE brand_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  memory_type     TEXT NOT NULL DEFAULT 'insight',
  content         TEXT NOT NULL,
  source          TEXT,
  confidence      NUMERIC DEFAULT 1.0,
  embedding_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HUMAN FEEDBACK
-- ============================================================

CREATE TABLE human_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id),
  agent_run_id    UUID REFERENCES agent_runs(id),
  user_id         UUID REFERENCES users(id),
  feedback_type   TEXT NOT NULL,
  comment         TEXT,
  edited_content  TEXT,
  used_for_training BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  action_url      TEXT,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     UUID,
  metadata        JSONB DEFAULT '{}',
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_brands_org ON brands(org_id);
CREATE INDEX idx_knowledge_docs_brand ON knowledge_documents(brand_id, status);
CREATE INDEX idx_knowledge_chunks_brand ON knowledge_chunks(brand_id);
CREATE INDEX idx_knowledge_chunks_doc ON knowledge_chunks(document_id);
CREATE INDEX idx_campaigns_brand ON campaigns(brand_id, status);
CREATE INDEX idx_content_brand_status ON content(brand_id, status);
CREATE INDEX idx_content_campaign ON content(campaign_id);
CREATE INDEX idx_scheduled_posts_time ON scheduled_posts(scheduled_at, status);
CREATE INDEX idx_scheduled_posts_brand ON scheduled_posts(brand_id);
CREATE INDEX idx_post_analytics_post ON post_analytics(scheduled_post_id);
CREATE INDEX idx_agent_runs_brand ON agent_runs(brand_id, started_at DESC);
CREATE INDEX idx_brand_memory_brand ON brand_memory(brand_id, memory_type);
CREATE INDEX idx_trend_reports_brand_date ON trend_reports(brand_id, report_date DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_audit_logs_org ON audit_logs(org_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see data in their organization
-- (Real RLS policies reference org_id via JWT claim)
-- Apply after you configure Supabase Auth with org_id in JWT

-- ============================================================
-- FUNCTION: auto-create user record on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires on every new signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: auto-update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
