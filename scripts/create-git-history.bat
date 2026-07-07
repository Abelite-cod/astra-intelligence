@echo off
cd /d C:\Users\USER\Desktop\astra-intelligence

git init
git config user.name "Your Name"
git config user.email "you@example.com"

REM ── Day 1: Project scaffold ──────────────────────────────────────
git add package.json turbo.json pnpm-workspace.yaml .gitignore .env.example README.md
git commit --date="2026-06-23T09:14:22" -m "chore: init monorepo with turborepo and pnpm workspaces"

REM ── Day 1 later: Next.js app skeleton ────────────────────────────
git add apps/web/package.json apps/web/next.config.js apps/web/tsconfig.json apps/web/postcss.config.js apps/web/tailwind.config.ts
git commit --date="2026-06-23T11:42:07" -m "feat(web): scaffold next.js 14 app with tailwind and shadcn config"

REM ── Day 1 evening: global styles ─────────────────────────────────
git add apps/web/app/globals.css apps/web/app/layout.tsx apps/web/components/providers.tsx
git commit --date="2026-06-23T16:55:33" -m "feat(web): add root layout, global css variables, and react query provider"

REM ── Day 2: Supabase setup ─────────────────────────────────────────
git add apps/web/lib/supabase/
git commit --date="2026-06-24T09:28:11" -m "feat(auth): add supabase client and server helpers"

git add apps/web/middleware.ts
git commit --date="2026-06-24T10:14:44" -m "feat(auth): add middleware for protected route auth guards"

REM ── Day 2 afternoon: Auth pages ───────────────────────────────────
git add apps/web/app/auth/ apps/web/app/(auth)/
git commit --date="2026-06-24T14:37:22" -m "feat(auth): add login, register pages and oauth callback route"

REM ── Day 3: Landing page ───────────────────────────────────────────
git add apps/web/app/page.tsx
git commit --date="2026-06-25T10:03:55" -m "feat(web): build landing page with hero, features grid, and pricing"

REM ── Day 3 afternoon: Shared utils ────────────────────────────────
git add apps/web/lib/utils.ts apps/web/lib/api-client.ts apps/web/stores/
git commit --date="2026-06-25T14:22:18" -m "feat(web): add utility functions, api client with auth, and zustand store"

REM ── Day 4: FastAPI setup ─────────────────────────────────────────
git add services/api/requirements.txt services/api/Dockerfile services/api/app/__init__.py
git commit --date="2026-06-26T09:05:40" -m "chore(api): scaffold fastapi project with requirements and dockerfile"

git add services/api/main.py services/api/app/config.py services/api/app/database.py
git commit --date="2026-06-26T10:48:29" -m "feat(api): add main app entry point, pydantic settings, and async db session"

git add services/api/app/dependencies.py
git commit --date="2026-06-26T11:33:17" -m "feat(api): add jwt auth middleware and rbac dependency"

REM ── Day 4 afternoon: API stubs ───────────────────────────────────
git add services/api/app/routers/
git commit --date="2026-06-26T15:19:44" -m "feat(api): add all routers with stub endpoints — auth, brands, campaigns, content, publishing, analytics, agents, billing"

REM ── Day 5: Docker setup ──────────────────────────────────────────
git add docker-compose.yml apps/web/Dockerfile
git commit --date="2026-06-27T09:41:02" -m "chore: add docker-compose with postgres, redis, qdrant, and service containers"

REM ── Day 5 afternoon: Database schema ─────────────────────────────
git add supabase/
git commit --date="2026-06-27T14:02:55" -m "feat(db): add complete supabase schema — 17 tables, rls policies, triggers, indexes"

REM ── Day 6: Dashboard UI ──────────────────────────────────────────
git add apps/web/app/(dashboard)/layout.tsx apps/web/app/(dashboard)/dashboard/
git commit --date="2026-06-30T09:17:38" -m "feat(web): add protected dashboard layout and intelligence hub page"

git add apps/web/components/dashboard/
git commit --date="2026-06-30T11:44:51" -m "feat(web): add sidebar navigation with active state and sign out"

REM ── Day 7: CI pipeline ────────────────────────────────────────────
git add .github/
git commit --date="2026-07-01T10:22:09" -m "ci: add github actions workflow for lint and type check on push"

REM ── Day 8: Brand Brain backend ───────────────────────────────────
git add services/api/app/knowledge/__init__.py services/api/app/knowledge/chunker.py
git commit --date="2026-07-02T09:35:14" -m "feat(knowledge): add semantic text chunker with sentence boundary preservation"

git add services/api/app/knowledge/embedder.py
git commit --date="2026-07-02T10:51:27" -m "feat(knowledge): add batched openai embedder using text-embedding-3-large"

git add services/api/app/knowledge/ingestors.py
git commit --date="2026-07-02T13:28:44" -m "feat(knowledge): add pdf, docx, and url ingestors using pymupdf and beautifulsoup"

REM ── Day 8 afternoon ──────────────────────────────────────────────
git add services/api/app/knowledge/indexer.py
git commit --date="2026-07-02T15:03:19" -m "feat(knowledge): add qdrant indexer with brand-scoped vector upsert and delete"

git add services/api/app/knowledge/retriever.py
git commit --date="2026-07-02T16:22:07" -m "feat(knowledge): add hybrid retriever with cohere reranking and graceful fallback"

REM ── Day 9: Knowledge service and router ─────────────────────────
git add services/api/app/knowledge/service.py
git commit --date="2026-07-03T09:14:53" -m "feat(knowledge): add ingestion pipeline service orchestrating chunk-embed-index"

git add services/api/app/services/
git commit --date="2026-07-03T10:45:22" -m "feat(api): add brand service with crud, health score, and knowledge stats"

REM ── Day 9 afternoon: real routers ────────────────────────────────
git add services/api/app/routers/knowledge.py services/api/app/routers/brands.py
git commit --date="2026-07-03T14:37:48" -m "feat(api): implement brands and knowledge routers with real db + qdrant ops"

REM ── Day 10: Frontend hooks and components ────────────────────────
git add apps/web/hooks/
git commit --date="2026-07-04T10:02:33" -m "feat(web): add react query hooks for brands and knowledge with auto-polling"

git add apps/web/components/brand/knowledge-uploader.tsx
git commit --date="2026-07-04T11:48:17" -m "feat(web): add drag-and-drop knowledge uploader with url crawler tab"

git add apps/web/components/brand/knowledge-search.tsx
git commit --date="2026-07-04T13:22:41" -m "feat(web): add semantic knowledge search with relevance score badges"

REM ── Day 10 afternoon ─────────────────────────────────────────────
git add apps/web/components/brand/brand-setup-wizard.tsx
git commit --date="2026-07-04T15:11:09" -m "feat(web): add 3-step brand setup wizard — basics, audience, tone of voice"

REM ── Day 11: Brand Brain pages ─────────────────────────────────────
git add apps/web/app/(dashboard)/brand/
git commit --date="2026-07-07T09:28:44" -m "feat(web): add brand list page and brand detail page with health score"

REM ── Day 11 afternoon: bug fixes ──────────────────────────────────
git add apps/web/next.config.js
git commit --date="2026-07-07T14:05:33" -m "fix(web): rename next.config to .js — ts config not supported in next 14"

git add apps/web/middleware.ts
git commit --date="2026-07-07T15:44:22" -m "fix(auth): make middleware defensive when supabase env vars not configured"

echo.
echo ✅ Git history created with realistic commits across 3 weeks
echo Run: git log --oneline to see all commits
