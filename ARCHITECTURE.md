# Astra Intelligence — Complete Architecture & Roadmap
### The Autonomous AI Marketing Operating System
> Senior Lead Architecture Document · Version 1.0

---

## Table of Contents

1. [Executive Vision](#1-executive-vision)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [Monorepo Folder Structure](#3-monorepo-folder-structure)
4. [Database Schema](#4-database-schema)
5. [API Contract](#5-api-contract)
6. [Multi-Agent Architecture](#6-multi-agent-architecture)
7. [RAG & Knowledge Layer](#7-rag--knowledge-layer)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Background Workers & Queue Design](#9-background-workers--queue-design)
10. [Observability & Evaluation](#10-observability--evaluation)
11. [Security Architecture](#11-security-architecture)
12. [DevOps, Docker & Deployment](#12-devops-docker--deployment)
13. [Phased Implementation Roadmap](#13-phased-implementation-roadmap)
14. [Pricing Model](#14-pricing-model)
15. [What Makes This $100M](#15-what-makes-this-100m)

---

## 1. Executive Vision

**Astra Intelligence** is not a social media posting tool.

It is the operating system for AI-powered marketing teams.

### The Problem

Every growing company has the same bottleneck:

```
Marketing Strategy → Research → Planning → Content Creation
→ Design → Approval → Publishing → Analytics → Optimization
```

This requires 5–10 people, $200K–$1M/year in salaries, and months of execution.

### The Solution

Astra replaces the entire workflow with a coordinated multi-agent system that:

- **Learns** your business deeply (Brand Brain)
- **Monitors** your market daily (Trend Intelligence)
- **Strategizes** campaigns autonomously (CEO Agent)
- **Creates** all content formats (Content Factory)
- **Learns from outcomes** (Feedback Loop)

### Positioning

| What it's NOT | What it IS |
|---|---|
| ChatGPT wrapper | Autonomous marketing system |
| Buffer / Hootsuite | Strategic marketing intelligence |
| Canva AI | Full creative engine |
| Copy.ai | Brand-aware content OS |

**Competitor**: A 5-person marketing department, not another AI writing tool.

---

## 2. Tech Stack Decisions

### Why these choices — justified

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | RSC performance, streaming, SEO, auth patterns |
| UI | Shadcn/ui + Tailwind | Production quality, accessible, fully owned |
| State | Zustand + React Query | Server state vs client state separation |
| Backend | FastAPI (Python) | Async, OpenAPI auto-docs, AI ecosystem native |
| Workers | Celery + Redis | Battle-tested distributed task queue |
| Primary DB | PostgreSQL (Supabase) | ACID, RLS, realtime, auth built-in |
| Vector DB | Qdrant | Self-hostable, payload filtering, fast ANN |
| Cache | Redis | Sessions, queues, rate limiting, pub/sub |
| Search | Meilisearch | Hybrid BM25 + vector, self-hosted |
| Object Storage | Supabase Storage / S3 | PDFs, images, videos, assets |
| LLMs | Claude 3.5 Sonnet (primary), GPT-4o (fallback), Gemini 1.5 Pro (long context) |
| Embeddings | text-embedding-3-large + BGE-M3 | English + multilingual |
| Image Gen | Flux Pro + Ideogram v2 + GPT-Image-1 | Quality + speed |
| Video Gen | Runway ML Gen-3 + Kling | Short-form video |
| Observability | Langfuse | LLM tracing, prompt versioning, evals |
| Orchestration | LangGraph | Stateful multi-agent graphs |
| Scheduling | Temporal | Durable workflows, retries, long-running |
| Monitoring | Prometheus + Grafana | Infra metrics |
| Logging | Loki + Grafana | Centralized logs |
| Auth | Supabase Auth + NextAuth | SSO, RBAC, OAuth |
| Payments | Stripe | Subscriptions, usage billing |
| Email | Resend | Transactional emails |
| CI/CD | GitHub Actions | Automated tests + deployments |
| Containers | Docker + Docker Compose (dev) / Kubernetes (prod) | Scalable infra |

---

## 3. Monorepo Folder Structure

```
astra-intelligence/
│
├── apps/
│   ├── web/                          # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── onboarding/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx              # Intelligence Hub
│   │   │   │   ├── brand/
│   │   │   │   │   ├── page.tsx          # Brand Brain setup
│   │   │   │   │   └── knowledge/
│   │   │   │   ├── campaigns/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   └── new/
│   │   │   │   ├── content/
│   │   │   │   │   ├── page.tsx          # Content factory
│   │   │   │   │   ├── calendar/
│   │   │   │   │   ├── drafts/
│   │   │   │   │   └── approvals/
│   │   │   │   ├── publish/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── scheduler/
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── page.tsx          # Analytics Brain
│   │   │   │   │   ├── revenue/
│   │   │   │   │   └── competitor/
│   │   │   │   ├── agents/
│   │   │   │   │   ├── page.tsx          # Agent activity log
│   │   │   │   │   └── runs/
│   │   │   │   ├── settings/
│   │   │   │   │   ├── workspace/
│   │   │   │   │   ├── integrations/
│   │   │   │   │   ├── billing/
│   │   │   │   │   └── team/
│   │   │   │   └── admin/               # Super admin panel
│   │   │   └── api/
│   │   │       └── [...]/               # Next.js API routes (thin proxies)
│   │   ├── components/
│   │   │   ├── ui/                      # Shadcn base components
│   │   │   ├── brand/
│   │   │   ├── campaign/
│   │   │   ├── content/
│   │   │   ├── analytics/
│   │   │   ├── agents/
│   │   │   └── shared/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   ├── stores/                      # Zustand stores
│   │   └── types/
│   │
│   └── docs/                            # Public docs site (Nextra)
│
├── services/
│   ├── api/                             # FastAPI core backend
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── organizations.py
│   │   │   ├── brands.py
│   │   │   ├── knowledge.py
│   │   │   ├── campaigns.py
│   │   │   ├── content.py
│   │   │   ├── publishing.py
│   │   │   ├── analytics.py
│   │   │   ├── agents.py
│   │   │   ├── integrations.py
│   │   │   └── billing.py
│   │   ├── models/
│   │   │   ├── organization.py
│   │   │   ├── brand.py
│   │   │   ├── campaign.py
│   │   │   ├── content.py
│   │   │   ├── post.py
│   │   │   ├── analytics.py
│   │   │   └── agent_run.py
│   │   ├── schemas/                     # Pydantic v2 schemas
│   │   ├── services/
│   │   │   ├── brand_service.py
│   │   │   ├── campaign_service.py
│   │   │   ├── content_service.py
│   │   │   ├── publishing_service.py
│   │   │   ├── analytics_service.py
│   │   │   └── knowledge_service.py
│   │   ├── middleware/
│   │   │   ├── auth.py
│   │   │   ├── rate_limit.py
│   │   │   └── logging.py
│   │   └── tests/
│   │
│   ├── agents/                          # LangGraph multi-agent system
│   │   ├── orchestrator/
│   │   │   ├── graph.py                 # Main LangGraph state machine
│   │   │   ├── state.py
│   │   │   └── router.py
│   │   ├── specialists/
│   │   │   ├── ceo_agent.py
│   │   │   ├── strategist_agent.py
│   │   │   ├── research_agent.py
│   │   │   ├── trend_agent.py
│   │   │   ├── seo_agent.py
│   │   │   ├── writer_agent.py
│   │   │   ├── editor_agent.py
│   │   │   ├── reviewer_agent.py
│   │   │   ├── designer_agent.py
│   │   │   ├── image_agent.py
│   │   │   ├── video_agent.py
│   │   │   ├── publisher_agent.py
│   │   │   ├── analytics_agent.py
│   │   │   └── growth_agent.py
│   │   ├── tools/
│   │   │   ├── web_search.py
│   │   │   ├── trend_scraper.py
│   │   │   ├── competitor_monitor.py
│   │   │   ├── knowledge_retriever.py
│   │   │   ├── image_generator.py
│   │   │   ├── video_generator.py
│   │   │   ├── social_publisher.py
│   │   │   ├── analytics_fetcher.py
│   │   │   └── email_sender.py
│   │   ├── memory/
│   │   │   ├── long_term.py             # Qdrant vector memory
│   │   │   ├── short_term.py            # Redis conversation memory
│   │   │   └── episodic.py              # Campaign history
│   │   ├── prompts/
│   │   │   ├── system_prompts/
│   │   │   └── templates/
│   │   └── evaluators/
│   │       ├── hallucination_detector.py
│   │       ├── brand_voice_scorer.py
│   │       ├── toxicity_checker.py
│   │       └── fact_checker.py
│   │
│   ├── workers/                         # Celery workers
│   │   ├── celery_app.py
│   │   ├── tasks/
│   │   │   ├── ingest_knowledge.py
│   │   │   ├── run_agent_workflow.py
│   │   │   ├── schedule_posts.py
│   │   │   ├── fetch_analytics.py
│   │   │   ├── morning_intelligence.py  # Daily market scan
│   │   │   └── learning_loop.py
│   │   └── beats/                       # Periodic tasks (cron)
│   │       └── schedules.py
│   │
│   └── knowledge/                       # RAG + indexing service
│       ├── ingestion/
│       │   ├── pdf_ingester.py
│       │   ├── web_crawler.py
│       │   ├── docx_ingester.py
│       │   ├── csv_ingester.py
│       │   └── social_history_ingester.py
│       ├── chunking/
│       │   ├── semantic_chunker.py
│       │   └── recursive_chunker.py
│       ├── embeddings/
│       │   └── embedder.py
│       ├── retrieval/
│       │   ├── hybrid_retriever.py      # BM25 + vector
│       │   ├── reranker.py              # Cohere Rerank
│       │   └── contextual_compressor.py
│       └── indexer.py
│
├── packages/
│   ├── shared-types/                    # TypeScript types shared across apps
│   ├── shared-utils/                    # Shared utilities
│   └── ui-kit/                          # Design system components
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.workers
│   │   └── Dockerfile.knowledge
│   ├── docker-compose.yml               # Full local stack
│   ├── docker-compose.dev.yml
│   ├── kubernetes/
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── ingress/
│   │   └── configmaps/
│   └── terraform/                       # IaC (AWS/GCP)
│
├── scripts/
│   ├── seed_db.py
│   ├── migrate.py
│   └── test_agents.py
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-prod.yml
│
├── .env.example
├── docker-compose.yml
├── turbo.json                            # Turborepo config
├── package.json
└── README.md
```

---

## 4. Database Schema

### Core Tables (PostgreSQL via Supabase)

```sql
-- ============================================================
-- ORGANIZATIONS & USERS
-- ============================================================

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  plan            TEXT NOT NULL DEFAULT 'starter', -- starter|pro|business|enterprise
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  seats           INT NOT NULL DEFAULT 3,
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'member', -- owner|admin|manager|member|viewer
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member',
  token           TEXT UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  invited_by      UUID REFERENCES users(id)
);

-- ============================================================
-- BRAND BRAIN
-- ============================================================

CREATE TABLE brands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  mission         TEXT,
  vision          TEXT,
  values          TEXT[],
  tone_of_voice   TEXT, -- professional|casual|bold|playful|authoritative
  target_audience JSONB, -- {demographics, psychographics, pain_points, platforms}
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

CREATE TABLE knowledge_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL, -- pdf|docx|url|csv|txt|social_history
  source_url      TEXT,
  file_path       TEXT,
  content_hash    TEXT,          -- dedup
  status          TEXT DEFAULT 'pending', -- pending|processing|indexed|failed
  chunk_count     INT DEFAULT 0,
  token_count     INT DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  chunk_index     INT NOT NULL,
  token_count     INT,
  metadata        JSONB DEFAULT '{}',  -- {page, section, heading}
  embedding_id    TEXT,                 -- Qdrant point ID
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================

CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES users(id),
  name            TEXT NOT NULL,
  goal            TEXT,                -- awareness|leads|sales|engagement|retention
  description     TEXT,
  target_audience TEXT,
  start_date      DATE,
  end_date        DATE,
  platforms       TEXT[],              -- linkedin|twitter|instagram|facebook|tiktok|email
  status          TEXT DEFAULT 'draft', -- draft|active|paused|completed|archived
  ai_strategy     JSONB,               -- AI-generated strategy document
  budget          NUMERIC,
  kpis            JSONB DEFAULT '{}',  -- {target_reach, target_leads, target_revenue}
  results         JSONB DEFAULT '{}',  -- filled by analytics agent
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_calendar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  content_id      UUID REFERENCES content(id),
  scheduled_date  DATE NOT NULL,
  platform        TEXT NOT NULL,
  time_slot       TIME,
  status          TEXT DEFAULT 'planned', -- planned|draft|approved|scheduled|published|failed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTENT
-- ============================================================

CREATE TABLE content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id     UUID REFERENCES campaigns(id),
  created_by      UUID REFERENCES users(id),
  type            TEXT NOT NULL,       -- post|carousel|thread|reel|blog|email|newsletter|ad
  platform        TEXT NOT NULL,       -- linkedin|twitter|instagram|facebook|tiktok|email|medium
  title           TEXT,
  body            TEXT,
  hook            TEXT,                -- First line / attention grabber
  cta             TEXT,                -- Call to action
  hashtags        TEXT[],
  mentions        TEXT[],
  media_urls      TEXT[],
  thumbnail_url   TEXT,
  ai_metadata     JSONB DEFAULT '{}',  -- {model, prompt_version, tokens, quality_scores}
  quality_scores  JSONB DEFAULT '{}',  -- {brand_voice, readability, engagement_prediction, fact_score}
  status          TEXT DEFAULT 'draft', -- draft|review|approved|rejected|published|archived
  version         INT DEFAULT 1,
  parent_id       UUID REFERENCES content(id), -- for versioning
  agent_run_id    UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_revisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id) ON DELETE CASCADE,
  version         INT NOT NULL,
  body            TEXT NOT NULL,
  changed_by      UUID REFERENCES users(id),
  change_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id) ON DELETE CASCADE,
  reviewer_id     UUID REFERENCES users(id),
  status          TEXT NOT NULL,       -- pending|approved|rejected|revision_requested
  comment         TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEDULED POSTS & PUBLISHING
-- ============================================================

CREATE TABLE scheduled_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id) ON DELETE CASCADE,
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  platform_account_id TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  published_at    TIMESTAMPTZ,
  platform_post_id TEXT,               -- ID returned by social API
  status          TEXT DEFAULT 'scheduled', -- scheduled|publishing|published|failed|cancelled
  error_message   TEXT,
  retry_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE social_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,       -- linkedin|twitter|instagram|facebook|tiktok
  account_id      TEXT NOT NULL,
  account_name    TEXT,
  account_url     TEXT,
  access_token    TEXT,                -- encrypted at rest
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes          TEXT[],
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS
-- ============================================================

CREATE TABLE post_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  impressions     BIGINT DEFAULT 0,
  reach           BIGINT DEFAULT 0,
  likes           INT DEFAULT 0,
  comments        INT DEFAULT 0,
  shares          INT DEFAULT 0,
  saves           INT DEFAULT 0,
  clicks          INT DEFAULT 0,
  ctr             NUMERIC,
  engagement_rate NUMERIC,
  video_views     INT DEFAULT 0,
  watch_time_sec  INT DEFAULT 0,
  profile_visits  INT DEFAULT 0,
  followers_gained INT DEFAULT 0,
  raw_data        JSONB DEFAULT '{}'
);

CREATE TABLE campaign_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  total_reach     BIGINT DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_engagement BIGINT DEFAULT 0,
  total_clicks    BIGINT DEFAULT 0,
  leads_generated INT DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  cost            NUMERIC DEFAULT 0,
  roi             NUMERIC,
  top_content     JSONB DEFAULT '[]',
  platform_breakdown JSONB DEFAULT '{}'
);

CREATE TABLE competitor_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  competitor_url  TEXT NOT NULL,
  competitor_name TEXT,
  platform        TEXT,
  snapshot_date   DATE DEFAULT CURRENT_DATE,
  post_count      INT DEFAULT 0,
  avg_engagement  NUMERIC,
  top_topics      TEXT[],
  top_posts       JSONB DEFAULT '[]',
  audience_size   BIGINT,
  growth_rate     NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI AGENTS & RUNS
-- ============================================================

CREATE TABLE agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id     UUID REFERENCES campaigns(id),
  triggered_by    UUID REFERENCES users(id),
  workflow_type   TEXT NOT NULL,       -- morning_intel|campaign_create|content_gen|analytics|learning_loop
  status          TEXT DEFAULT 'running', -- running|completed|failed|cancelled
  input           JSONB DEFAULT '{}',
  output          JSONB DEFAULT '{}',
  agent_trace     JSONB DEFAULT '[]',  -- step-by-step agent decisions
  tokens_used     INT DEFAULT 0,
  cost_usd        NUMERIC DEFAULT 0,
  duration_ms     INT,
  langfuse_trace_id TEXT,
  error_message   TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE TABLE agent_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  agent_name      TEXT NOT NULL,
  role            TEXT NOT NULL,       -- system|user|assistant|tool
  content         TEXT NOT NULL,
  tool_call       JSONB,
  tool_result     JSONB,
  tokens          INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trend_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  report_date     DATE DEFAULT CURRENT_DATE,
  trends          JSONB DEFAULT '[]',  -- [{topic, score, source, relevance, suggested_angle}]
  competitor_moves JSONB DEFAULT '[]',
  opportunities   JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  status          TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEMORY & LEARNING
-- ============================================================

CREATE TABLE brand_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brands(id) ON DELETE CASCADE,
  memory_type     TEXT NOT NULL,       -- insight|lesson|preference|constraint
  content         TEXT NOT NULL,
  source          TEXT,                -- campaign_id|post_id|user_feedback
  confidence      NUMERIC DEFAULT 1.0,
  embedding_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE human_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id),
  agent_run_id    UUID REFERENCES agent_runs(id),
  user_id         UUID REFERENCES users(id),
  feedback_type   TEXT NOT NULL,       -- thumbs_up|thumbs_down|edit|comment
  comment         TEXT,
  edited_content  TEXT,
  used_for_training BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS & AUDIT
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  action_url      TEXT,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL,       -- content.create|post.approve|campaign.launch
  resource_type   TEXT,
  resource_id     UUID,
  metadata        JSONB DEFAULT '{}',
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_knowledge_chunks_brand ON knowledge_chunks(brand_id);
CREATE INDEX idx_content_brand_status ON content(brand_id, status);
CREATE INDEX idx_scheduled_posts_time ON scheduled_posts(scheduled_at, status);
CREATE INDEX idx_post_analytics_post ON post_analytics(scheduled_post_id);
CREATE INDEX idx_agent_runs_brand ON agent_runs(brand_id, started_at DESC);
CREATE INDEX idx_brand_memory_brand ON brand_memory(brand_id, memory_type);
CREATE INDEX idx_trend_reports_brand_date ON trend_reports(brand_id, report_date DESC);
```

---

## 5. API Contract

### Base URL: `https://api.astra-intelligence.com/v1`

All endpoints require `Authorization: Bearer <token>` except auth routes.

---

### Auth

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me
```

---

### Organizations

```
GET    /organizations/:id
PATCH  /organizations/:id
DELETE /organizations/:id
GET    /organizations/:id/members
POST   /organizations/:id/invite
DELETE /organizations/:id/members/:userId
PATCH  /organizations/:id/members/:userId/role
GET    /organizations/:id/usage
GET    /organizations/:id/audit-logs
```

---

### Brands

```
GET    /brands
POST   /brands
GET    /brands/:id
PATCH  /brands/:id
DELETE /brands/:id
POST   /brands/:id/onboard          # Full onboarding wizard
GET    /brands/:id/health-score     # AI brand health report
```

---

### Knowledge Base

```
GET    /brands/:id/knowledge
POST   /brands/:id/knowledge/upload         # multipart file upload
POST   /brands/:id/knowledge/url            # crawl URL
DELETE /brands/:id/knowledge/:docId
GET    /brands/:id/knowledge/:docId/status
POST   /brands/:id/knowledge/search         # semantic search
POST   /brands/:id/knowledge/reindex        # force reindex
```

---

### Campaigns

```
GET    /brands/:id/campaigns
POST   /brands/:id/campaigns
GET    /brands/:id/campaigns/:campaignId
PATCH  /brands/:id/campaigns/:campaignId
DELETE /brands/:id/campaigns/:campaignId
POST   /brands/:id/campaigns/:campaignId/generate-strategy  # AI strategy
POST   /brands/:id/campaigns/:campaignId/generate-calendar  # AI calendar
GET    /brands/:id/campaigns/:campaignId/analytics
POST   /brands/:id/campaigns/:campaignId/launch
POST   /brands/:id/campaigns/:campaignId/pause
```

---

### Content

```
GET    /brands/:id/content
POST   /brands/:id/content/generate         # AI generate content
POST   /brands/:id/content/repurpose        # one topic → many formats
GET    /brands/:id/content/:contentId
PATCH  /brands/:id/content/:contentId
DELETE /brands/:id/content/:contentId
GET    /brands/:id/content/:contentId/versions
POST   /brands/:id/content/:contentId/approve
POST   /brands/:id/content/:contentId/reject
POST   /brands/:id/content/:contentId/request-revision
POST   /brands/:id/content/:contentId/feedback  # human feedback
```

---

### Publishing

```
GET    /brands/:id/social-accounts
POST   /brands/:id/social-accounts/connect/:platform
DELETE /brands/:id/social-accounts/:accountId
POST   /brands/:id/schedule                 # schedule a post
GET    /brands/:id/scheduled                # get scheduled queue
PATCH  /brands/:id/scheduled/:postId
DELETE /brands/:id/scheduled/:postId
POST   /brands/:id/scheduled/:postId/publish-now
GET    /brands/:id/calendar                 # calendar view
```

---

### Analytics

```
GET    /brands/:id/analytics/overview
GET    /brands/:id/analytics/posts
GET    /brands/:id/analytics/campaigns
GET    /brands/:id/analytics/competitors
GET    /brands/:id/analytics/trends
GET    /brands/:id/analytics/revenue        # requires CRM integration
POST   /brands/:id/analytics/sync           # manual sync from platforms
```

---

### Agents & Intelligence

```
GET    /brands/:id/agent-runs
GET    /brands/:id/agent-runs/:runId
POST   /brands/:id/agent-runs/:runId/cancel
GET    /brands/:id/agent-runs/:runId/stream  # SSE stream of agent progress
POST   /brands/:id/intelligence/morning-report
POST   /brands/:id/intelligence/competitor-scan
POST   /brands/:id/intelligence/trend-scan
POST   /brands/:id/intelligence/chat         # chat with brand AI
```

---

### Integrations

```
GET    /integrations
POST   /integrations/hubspot/connect
POST   /integrations/salesforce/connect
POST   /integrations/stripe/connect
POST   /integrations/shopify/connect
DELETE /integrations/:integrationId
POST   /integrations/:integrationId/sync
```

---

### Billing

```
GET    /billing/plans
GET    /billing/subscription
POST   /billing/checkout                    # Stripe checkout session
POST   /billing/portal                      # Stripe customer portal
GET    /billing/invoices
GET    /billing/usage
```

---

### Admin (super admin only)

```
GET    /admin/organizations
GET    /admin/usage-stats
GET    /admin/agent-costs
POST   /admin/impersonate/:orgId
```

---

## 6. Multi-Agent Architecture

### Design Philosophy

Each agent is a **specialist** with a single responsibility. The **Orchestrator** (CEO Agent) delegates, coordinates, and synthesizes. Agents communicate through a **shared state** graph managed by LangGraph.

### State Graph

```python
class AstraAgentState(TypedDict):
    # Identity
    brand_id: str
    campaign_id: Optional[str]
    run_id: str
    workflow_type: str
    
    # Context
    brand_context: dict       # brand brain snapshot
    user_intent: str          # what the user wants
    
    # Working memory
    research_results: list
    trend_data: list
    competitor_data: list
    seo_keywords: list
    
    # Content
    strategy: Optional[dict]
    content_drafts: list
    current_draft: Optional[dict]
    
    # Quality
    review_scores: dict
    hallucination_flags: list
    brand_voice_score: float
    
    # Decisions
    next_agent: str
    agent_history: list       # which agents ran in what order
    messages: list            # full conversation history
    
    # Output
    final_output: Optional[dict]
    error: Optional[str]
```

### Agent Responsibilities

| Agent | Input | Output | Tools Used |
|---|---|---|---|
| **CEO Agent** | User intent + brand context | Execution plan + agent assignments | Strategy templates |
| **Strategist** | Campaign goal + brand | Campaign strategy + content calendar | Knowledge retriever |
| **Research Agent** | Topic + brand context | Facts, statistics, citations | Tavily, Exa, PubMed |
| **Trend Agent** | Industry + competitors | Trending topics + opportunities | Google Trends, Reddit, Twitter, News API |
| **SEO Agent** | Topic + platform | Keywords, search volume, angles | Semrush API, keyword tools |
| **Writer Agent** | Brief + research + brand voice | Raw content draft | Knowledge retriever, brand memory |
| **Editor Agent** | Raw draft | Improved draft (structure, flow) | Grammar tools |
| **Reviewer Agent** | Edited draft | Quality scores + flags | Hallucination detector, toxicity check |
| **Designer Agent** | Content + brand | Image generation prompts | Brand color/font context |
| **Image Agent** | Image prompts | Generated images | Flux Pro, Ideogram, GPT-Image |
| **Video Agent** | Script + brand | Short-form video | Runway, Kling |
| **Publisher Agent** | Approved content | Scheduled/published post | Social API clients |
| **Analytics Agent** | Post IDs + time range | Performance metrics + insights | Platform APIs |
| **Growth Agent** | Campaign results + history | Strategy improvements + lessons | Brand memory updater |

### Orchestration Flow (Campaign Generation)

```
User: "Launch my new product AI Assistant Pro"
         │
         ▼
    CEO Agent
    - Reads brand context
    - Understands goal
    - Creates execution plan
         │
    ┌────┴────────────────────┐
    ▼                         ▼
Trend Agent              Research Agent
- What's trending         - Product facts
- What competitors        - Use cases
  are posting             - Statistics
    │                         │
    └────────────┬────────────┘
                 ▼
          Strategist Agent
          - Campaign strategy
          - 30-day calendar
          - Platform recommendations
                 │
          ┌──────┴──────┐
          ▼             ▼
       SEO Agent   Writer Agent (per platform)
       - Keywords   - LinkedIn post
       - Tags       - Twitter thread
                    - Instagram caption
                    - Blog outline
                    - Email draft
                 │
          ┌──────┴──────┐
          ▼             ▼
     Editor Agent   Designer Agent
     - Refine        - Image prompts
       drafts           per post
          │             │
          ▼             ▼
     Reviewer Agent   Image Agent
     - Fact check     - Generate
     - Brand voice      images
     - Quality score
          │
          ▼
     Output → Approval Queue → UI
```

---

## 7. RAG & Knowledge Layer

### Ingestion Pipeline

```
Document Upload
     │
     ▼
File Type Detection
     │
     ├── PDF → PyMuPDF extraction → text + tables
     ├── DOCX → python-docx → text + headings
     ├── URL → Playwright crawler → clean HTML
     ├── CSV → pandas → row serialization
     └── Video → Whisper transcription → text
     │
     ▼
Semantic Chunking
- Target: 512 tokens per chunk
- Overlap: 64 tokens
- Preserve: headings, tables, lists
     │
     ▼
Metadata Enrichment
- source, page, section, document_type
- brand_id, created_at, language
     │
     ▼
Dual Embedding
- text-embedding-3-large (1536d) → semantic
- BM25 index → Meilisearch → lexical
     │
     ▼
Qdrant Upsert
- payload: {brand_id, doc_id, chunk_index, metadata}
- namespace per brand
     │
     ▼
DB Update (knowledge_chunks table)
```

### Retrieval Pipeline (Hybrid)

```
Query
  │
  ├── Vector Search (Qdrant)
  │   - Filter by brand_id
  │   - top_k = 20
  │
  └── BM25 Search (Meilisearch)
      - Filter by brand_id
      - top_k = 20
        │
        ▼
    Reciprocal Rank Fusion (RRF)
    - Merge & deduplicate
    - Rerank with Cohere Rerank v3
        │
        ▼
    Top 5 chunks → Contextual Compression
        │
        ▼
    Pass to LLM with citations
```

---

## 8. Frontend Architecture

### Page → Component → Store → API Pattern

```
Page (Server Component)
  │ prefetch data
  ▼
Layout Component
  │
  ├── Sidebar (persistent)
  ├── Header (user menu, notifications)
  └── Page Content (Client Component)
           │
           ├── React Query (server state)
           │   useQuery, useMutation, useInfiniteQuery
           │
           ├── Zustand (client UI state)
           │   workspaceStore, contentEditorStore, agentStore
           │
           └── SSE / WebSocket (realtime)
               agent run progress, notifications, post status
```

### Key UI Modules

**Intelligence Hub (Dashboard)**
- Daily AI morning briefing card
- Trending opportunities feed
- Upcoming scheduled posts
- Recent agent activity
- Campaign performance summary

**Brand Brain Setup**
- Guided onboarding wizard (6 steps)
- Document upload drag-and-drop
- Website crawler
- Tone of voice selector with live preview
- Competitor input

**Campaign Builder**
- Goal-first campaign wizard
- AI strategy generation (streaming)
- 30/60/90-day calendar drag editor
- Platform selector

**Content Factory**
- Brief → Generate → Review → Approve
- Side-by-side platform preview
- Version history
- Inline editing
- AI suggestions toolbar
- One-click repurpose

**Analytics Brain**
- Multi-platform unified dashboard
- Revenue attribution (if CRM connected)
- Competitor comparison
- AI insights feed ("Your LinkedIn posts outperform Twitter by 3.2×")
- Export to PDF/CSV

---

## 9. Background Workers & Queue Design

### Celery Task Queues

| Queue | Priority | Workers | Tasks |
|---|---|---|---|
| `critical` | P0 | 4 | Publishing, auth webhooks |
| `ai_generation` | P1 | 8 | Content generation, agent runs |
| `ingestion` | P2 | 4 | Knowledge base indexing |
| `analytics` | P3 | 2 | Metric fetching |
| `low` | P4 | 2 | Emails, cleanup, reports |

### Scheduled Tasks (Celery Beat)

```python
CELERYBEAT_SCHEDULE = {
    # Every morning at 6AM UTC
    "morning-intelligence": {
        "task": "workers.tasks.morning_intelligence.run_for_all_active_brands",
        "schedule": crontab(hour=6, minute=0),
    },
    # Every hour
    "publish-scheduled-posts": {
        "task": "workers.tasks.schedule_posts.publish_due_posts",
        "schedule": crontab(minute=0),
    },
    # Every 4 hours
    "fetch-analytics": {
        "task": "workers.tasks.fetch_analytics.sync_all_platforms",
        "schedule": crontab(minute=0, hour="*/4"),
    },
    # Every night
    "learning-loop": {
        "task": "workers.tasks.learning_loop.process_feedback_and_update_memory",
        "schedule": crontab(hour=2, minute=0),
    },
    # Every 6 hours
    "competitor-monitor": {
        "task": "workers.tasks.competitor_monitor.scan_all_brands",
        "schedule": crontab(minute=0, hour="*/6"),
    },
}
```

---

## 10. Observability & Evaluation

### LLM Evaluation Metrics

| Metric | Tool | What it measures |
|---|---|---|
| Faithfulness | Langfuse + custom | Does output match source documents? |
| Brand Voice | Custom scorer (cosine sim) | Does output match brand tone? |
| Hallucination | NLI model | Are all claims supported? |
| Toxicity | Perspective API | Is content safe? |
| Engagement Prediction | Fine-tuned classifier | Will this post perform? |
| Readability | textstat | Flesch-Kincaid score |

### Tracing Stack

```
Every agent run → Langfuse trace
  - input/output per agent
  - token usage per model
  - latency per step
  - cost per run

All API requests → OpenTelemetry → Jaeger
  - distributed tracing
  - slow query detection

Infrastructure → Prometheus → Grafana
  - CPU, memory, queue depths
  - DB connections, cache hit rates
  - API error rates, p95/p99 latency

Logs → Loki → Grafana
  - structured JSON logs
  - searchable by brand_id, run_id
```

---

## 11. Security Architecture

### Authentication & Authorization

```
Frontend → Supabase Auth (JWT)
JWT → FastAPI middleware → validate → extract org_id + user_id + role
Role check → Row Level Security (Supabase) → data isolation per org
```

### Row Level Security Policy (example)

```sql
-- Users can only see their org's data
CREATE POLICY "brands_isolation" ON brands
  USING (org_id = auth.jwt() ->> 'org_id');
```

### Sensitive Data

- Social access tokens: **AES-256 encrypted** at rest in Postgres
- API keys: stored in HashiCorp Vault / environment secrets
- PII: GDPR-compliant data deletion endpoints
- File uploads: virus scanned, type validated, stored in isolated S3 buckets per org

### Rate Limiting

```
Public endpoints: 20 req/min per IP
Authenticated: 200 req/min per user
AI generation: 10 req/min per org (plan-dependent)
Publishing: 5 concurrent publishes per brand
```

---

## 12. DevOps, Docker & Deployment

### docker-compose.yml (local dev — full stack)

```yaml
version: "3.9"
services:
  web:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.web
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000
    depends_on: [api]

  api:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.api
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/astra
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
    depends_on: [postgres, redis, qdrant]

  workers:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.workers
    command: celery -A services.workers.celery_app worker --loglevel=info -Q critical,ai_generation,ingestion,analytics,low
    depends_on: [redis, api]

  celery-beat:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.workers
    command: celery -A services.workers.celery_app beat --loglevel=info
    depends_on: [redis]

  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: astra
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]
    volumes:
      - qdrant_data:/qdrant/storage

  meilisearch:
    image: getmeili/meilisearch:latest
    ports: ["7700:7700"]
    environment:
      MEILI_MASTER_KEY: localkey

  langfuse:
    image: langfuse/langfuse:latest
    ports: ["3001:3000"]
    depends_on: [postgres]

volumes:
  postgres_data:
  qdrant_data:
```

### CI/CD (GitHub Actions)

```
Push to main →
  Run tests (pytest + jest) →
  Build Docker images →
  Push to registry (GHCR) →
  Deploy to staging (auto) →
  Run smoke tests →
  Require manual approval →
  Deploy to production

PR → Run tests + lint + type check
```

### Kubernetes Production Setup

```
Namespace: astra-prod
  - Deployment: web (2+ replicas, HPA)
  - Deployment: api (3+ replicas, HPA)
  - Deployment: workers-ai (4+ replicas, HPA by queue depth)
  - Deployment: workers-low (2 replicas)
  - Deployment: celery-beat (1 replica)
  - StatefulSet: postgres (managed by Supabase)
  - StatefulSet: redis (Redis Cloud or Elasticache)
  - StatefulSet: qdrant (3 nodes, replication)
  
Ingress: NGINX → Cloudflare → SSL termination
Secrets: Sealed Secrets or External Secrets Operator → AWS Secrets Manager
Monitoring: Prometheus Operator + Grafana stack
```

---

## 13. Phased Implementation Roadmap

### Phase 0 — Foundation (Weeks 1–3)
> **Goal**: Working skeleton everyone can develop against

- [ ] Monorepo setup (Turborepo + pnpm)
- [ ] Next.js 14 app with auth (Supabase)
- [ ] FastAPI skeleton with all routers (empty handlers)
- [ ] Postgres schema migration (all tables)
- [ ] Celery + Redis setup
- [ ] Qdrant setup
- [ ] Docker Compose full stack
- [ ] CI pipeline (tests + lint)
- [ ] Environment config management

---

### Phase 1 — Brand Brain (Weeks 4–6)
> **MVP Promise**: "Tell us about your company. We'll remember everything."

- [ ] Onboarding wizard (6 steps)
- [ ] Document upload + ingestion pipeline
- [ ] URL crawler
- [ ] Semantic chunking + embedding
- [ ] Qdrant + Meilisearch indexing
- [ ] Brand knowledge search UI
- [ ] Brand Brain profile UI

---

### Phase 2 — Content Generation (Weeks 7–9)
> **MVP Promise**: "Generate on-brand content for any platform."

- [ ] Writer Agent (with brand context)
- [ ] Reviewer Agent (quality scores)
- [ ] Content generation UI
- [ ] Platform previews (LinkedIn, Twitter, Instagram)
- [ ] Approval workflow
- [ ] Version history
- [ ] Human feedback collection

---

### Phase 3 — Publishing (Weeks 10–11)
> **MVP Promise**: "Schedule and publish content automatically."

- [ ] Twitter/X OAuth integration
- [ ] LinkedIn OAuth integration
- [ ] Instagram Graph API integration
- [ ] Scheduling UI (calendar view)
- [ ] Publisher worker (Celery)
- [ ] Post status tracking

---

### Phase 4 — Intelligence (Weeks 12–14)
> **MVP Promise**: "Wake up every morning to AI-generated market intelligence."

- [ ] Trend Agent (Google Trends, Reddit, Twitter)
- [ ] Research Agent (Tavily, Exa)
- [ ] Competitor monitor worker
- [ ] Daily morning report generation
- [ ] Intelligence Hub dashboard

---

### Phase 5 — Campaign System (Weeks 15–17)
> **Goal**: Full AI-generated campaigns with calendar

- [ ] Campaign Builder UI
- [ ] Strategist Agent
- [ ] CEO Agent (orchestrator)
- [ ] 30-day calendar generation
- [ ] Multi-platform content batch generation
- [ ] Campaign analytics dashboard

---

### Phase 6 — Analytics Brain (Weeks 18–20)
> **Goal**: Know exactly what's working and why

- [ ] Platform analytics sync workers
- [ ] Unified analytics dashboard
- [ ] Analytics Agent (insights generation)
- [ ] Competitor comparison view
- [ ] Growth Agent (learning loop)
- [ ] Brand memory updates from results

---

### Phase 7 — Creative Engine (Weeks 21–23)
> **Goal**: Full AI creative production

- [ ] Designer Agent (image prompts)
- [ ] Image Agent (Flux Pro + Ideogram)
- [ ] Carousel generator
- [ ] Image editor UI
- [ ] Video Agent (Runway)
- [ ] Asset library

---

### Phase 8 — Enterprise Features (Weeks 24–26)
> **Goal**: Sell to teams, agencies, and enterprises

- [ ] Multi-workspace
- [ ] Team permissions (RBAC)
- [ ] Approval workflow (multi-step)
- [ ] White-label option
- [ ] Audit logs
- [ ] SSO (SAML)
- [ ] API access + webhooks
- [ ] Usage analytics admin

---

### Phase 9 — Revenue Intelligence (Weeks 27–30)
> **Goal**: Connect marketing to money

- [ ] HubSpot integration
- [ ] Salesforce integration
- [ ] Stripe/Shopify integration
- [ ] Revenue attribution model
- [ ] Pipeline generated metric
- [ ] ROI dashboard

---

### Phase 10 — Marketplace & Network Effects (Month 9+)
> **Goal**: Platform → ecosystem

- [ ] Prompt store
- [ ] Workflow templates
- [ ] Agent store (third-party)
- [ ] Brand template marketplace
- [ ] Public API for developers
- [ ] Plugin system

---

## 14. Pricing Model

| Plan | Price | Seats | Brands | AI Credits/month | Key Features |
|---|---|---|---|---|---|
| **Starter** | $39/mo | 1 | 1 | 100K tokens | Brand Brain, content gen, 3 platforms |
| **Pro** | $149/mo | 5 | 3 | 500K tokens | + Campaigns, analytics, all platforms |
| **Business** | $499/mo | 20 | 10 | 2M tokens | + Multi-agent, competitor intel, CRM |
| **Enterprise** | Custom | ∞ | ∞ | ∞ | + White label, SSO, SLA, custom models |

**Usage overage**: $0.002 per 1K tokens beyond plan limit

**Revenue target milestones**:
- 500 Starter users = $19,500 MRR
- 200 Pro users = $29,800 MRR
- 50 Business users = $24,950 MRR
- 5 Enterprise @ $5K avg = $25,000 MRR
- **Combined $100K MRR = $1.2M ARR** — achievable Year 1

---

## 15. What Makes This $100M

The product's defensibility does not come from the AI models.

It comes from:

### 1. Brand Memory (Data Moat)
Every document uploaded, every post published, every campaign result, every human edit feeds the Brand Brain. After 6 months, the AI knows your company better than any new hire. **You cannot take that to another tool.**

### 2. Learning Loop (Compounding Intelligence)
Every campaign that runs teaches the system. The analytics agent feeds the growth agent which updates prompts and memory. **The product literally gets smarter the more you use it.** Competitors starting from scratch cannot catch up.

### 3. Full Workflow Ownership (Switching Cost)
We don't just do one step. We own Strategy → Research → Creation → Approval → Publishing → Analytics. Each replacement requires switching 7 tools simultaneously. **Switching cost is enormous.**

### 4. Network Effects (Marketplace Phase)
When the prompt store and agent marketplace launch, third-party developers improve the platform. **Enterprise templates sold by agencies create B2B distribution.**

### 5. Revenue Attribution (CFO-level ROI)
When you connect Salesforce and a company can say "This LinkedIn campaign generated $340K in pipeline," they will never cancel. **You're no longer a marketing tool. You're in the revenue conversation.**

---

*Astra Intelligence Architecture v1.0 — Built to be the marketing OS, not a marketing tool.*
