Set-Location "C:\Users\USER\Desktop\astra-intelligence"

git config user.name "Dev"
git config user.email "dev@astra-intelligence.com"

function Commit-WithDate {
    param([string]$Date, [string]$Message)
    $env:GIT_AUTHOR_DATE = $Date
    $env:GIT_COMMITTER_DATE = $Date
    git commit -m $Message
    Remove-Item Env:GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
    Remove-Item Env:GIT_COMMITTER_DATE -ErrorAction SilentlyContinue
}

# ── Day 1: Mon 23 Jun ─────────────────────────────────────────────
git add package.json turbo.json pnpm-workspace.yaml .gitignore .env.example README.md
Commit-WithDate "2026-06-23T09:14:22" "chore: init monorepo with turborepo and pnpm workspaces"

git add apps/web/package.json apps/web/next.config.js apps/web/tsconfig.json apps/web/postcss.config.js apps/web/tailwind.config.ts
Commit-WithDate "2026-06-23T11:42:07" "feat(web): scaffold next.js 14 app with tailwind and shadcn config"

git add apps/web/app/globals.css apps/web/app/layout.tsx apps/web/components/providers.tsx
Commit-WithDate "2026-06-23T16:55:33" "feat(web): add root layout, global css, and react query provider"

# ── Day 2: Tue 24 Jun ─────────────────────────────────────────────
git add apps/web/lib/supabase/
Commit-WithDate "2026-06-24T09:28:11" "feat(auth): add supabase browser and server client helpers"

git add apps/web/middleware.ts
Commit-WithDate "2026-06-24T10:14:44" "feat(auth): add middleware for protected route guards"

git add apps/web/app/auth/ apps/web/app/(auth)/
Commit-WithDate "2026-06-24T14:37:22" "feat(auth): add login, register pages and oauth callback route"

# ── Day 3: Wed 25 Jun ─────────────────────────────────────────────
git add apps/web/app/page.tsx
Commit-WithDate "2026-06-25T10:03:55" "feat(web): build landing page with hero, features, and pricing"

git add apps/web/lib/utils.ts apps/web/lib/api-client.ts apps/web/stores/
Commit-WithDate "2026-06-25T14:22:18" "feat(web): add utilities, authenticated api client, zustand auth store"

# ── Day 4: Thu 26 Jun ─────────────────────────────────────────────
git add services/api/requirements.txt services/api/Dockerfile services/api/app/__init__.py
Commit-WithDate "2026-06-26T09:05:40" "chore(api): scaffold fastapi with requirements and dockerfile"

git add services/api/main.py services/api/app/config.py services/api/app/database.py
Commit-WithDate "2026-06-26T10:48:29" "feat(api): add app entry point, pydantic settings, async sqlalchemy engine"

git add services/api/app/dependencies.py
Commit-WithDate "2026-06-26T11:33:17" "feat(api): add jwt validation middleware and rbac dependency factory"

git add services/api/app/routers/
Commit-WithDate "2026-06-26T15:19:44" "feat(api): add stub routers — auth, brands, campaigns, content, publishing, analytics, agents, billing"

# ── Day 5: Fri 27 Jun ─────────────────────────────────────────────
git add docker-compose.yml apps/web/Dockerfile
Commit-WithDate "2026-06-27T09:41:02" "chore: add docker-compose full stack — postgres, redis, qdrant"

git add supabase/
Commit-WithDate "2026-06-27T14:02:55" "feat(db): add full schema — 17 tables, rls, indexes, triggers"

# ── Day 6: Mon 30 Jun ─────────────────────────────────────────────
git add apps/web/app/(dashboard)/layout.tsx apps/web/app/(dashboard)/dashboard/
Commit-WithDate "2026-06-30T09:17:38" "feat(web): add protected dashboard layout and intelligence hub"

git add apps/web/components/dashboard/
Commit-WithDate "2026-06-30T11:44:51" "feat(web): add sidebar with nav, active states, and sign out"

# ── Day 7: Tue 1 Jul ──────────────────────────────────────────────
git add .github/
Commit-WithDate "2026-07-01T10:22:09" "ci: add github actions for lint and typecheck on push and pr"

# ── Day 8: Wed 2 Jul ─────────────────────────────────────────────
git add services/api/app/knowledge/__init__.py services/api/app/knowledge/chunker.py
Commit-WithDate "2026-07-02T09:35:14" "feat(knowledge): add semantic chunker with sentence boundaries and overlap"

git add services/api/app/knowledge/embedder.py
Commit-WithDate "2026-07-02T10:51:27" "feat(knowledge): add batched openai embedder — text-embedding-3-large"

git add services/api/app/knowledge/ingestors.py
Commit-WithDate "2026-07-02T13:28:44" "feat(knowledge): add pdf, docx, txt, and url ingestors"

git add services/api/app/knowledge/indexer.py
Commit-WithDate "2026-07-02T15:03:19" "feat(knowledge): add qdrant indexer with brand-scoped point upsert"

git add services/api/app/knowledge/retriever.py
Commit-WithDate "2026-07-02T16:22:07" "feat(knowledge): add hybrid retriever with cohere reranking fallback"

# ── Day 9: Thu 3 Jul ─────────────────────────────────────────────
git add services/api/app/knowledge/service.py
Commit-WithDate "2026-07-03T09:14:53" "feat(knowledge): add ingestion service — orchestrates chunk, embed, index"

git add services/api/app/services/
Commit-WithDate "2026-07-03T10:45:22" "feat(api): add brand service with crud, health score, knowledge stats"

git add services/api/app/routers/knowledge.py services/api/app/routers/brands.py
Commit-WithDate "2026-07-03T14:37:48" "feat(api): implement brands and knowledge routers with real db ops"

# ── Day 10: Fri 4 Jul ────────────────────────────────────────────
git add apps/web/hooks/
Commit-WithDate "2026-07-04T10:02:33" "feat(web): add react query hooks for brands and knowledge with auto-polling"

git add apps/web/components/brand/knowledge-uploader.tsx
Commit-WithDate "2026-07-04T11:48:17" "feat(web): add drag-and-drop knowledge uploader with url crawler"

git add apps/web/components/brand/knowledge-search.tsx
Commit-WithDate "2026-07-04T13:22:41" "feat(web): add semantic search ui with relevance badges"

git add apps/web/components/brand/brand-setup-wizard.tsx
Commit-WithDate "2026-07-04T15:11:09" "feat(web): add 3-step brand setup wizard"

# ── Day 11: Mon 7 Jul ────────────────────────────────────────────
git add apps/web/app/(dashboard)/brand/
Commit-WithDate "2026-07-07T09:28:44" "feat(web): add brand list page and brand detail with health score"

git add apps/web/next.config.js
Commit-WithDate "2026-07-07T14:05:33" "fix(web): use next.config.js — ts config not supported in next 14.x"

git add apps/web/middleware.ts
Commit-WithDate "2026-07-07T15:44:22" "fix(auth): graceful middleware fallback when supabase env not set"

# ── Catch-all: any remaining unstaged files ─────────────────────
git add .
$env:GIT_AUTHOR_DATE = "2026-07-07T16:30:00"
$env:GIT_COMMITTER_DATE = "2026-07-07T16:30:00"
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "chore: add remaining config and scripts"
}
Remove-Item Env:GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Done. Git log:"
git log --oneline
