# Astra Intelligence

> The autonomous AI Chief Marketing Officer. Strategy, content, publishing, and analytics — all in one intelligent platform.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Shadcn/ui |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL via Supabase |
| Vector DB | Qdrant |
| Cache / Queue | Redis |
| Auth | Supabase Auth |
| AI Agents | LangGraph |
| LLMs | Claude 3.5 Sonnet + GPT-4o |

---

## Quick Start (local dev)

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.12+
- Docker + Docker Compose

### 1. Clone and install

```bash
git clone https://github.com/your-username/astra-intelligence
cd astra-intelligence
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in SUPABASE keys + at least one LLM key (OPENAI or ANTHROPIC)
```

### 3. Start all services with Docker

```bash
docker compose up -d postgres redis qdrant
```

### 4. Run Supabase migration

Go to your Supabase project → SQL Editor → paste and run:

```
supabase/migrations/001_initial_schema.sql
```

Or if running local Postgres:

```bash
psql -U postgres -d astra -f supabase/migrations/001_initial_schema.sql
```

### 5. Start the API

```bash
cd services/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 6. Start the frontend

```bash
pnpm dev
```

App: http://localhost:3000

---

## Project Structure

```
astra-intelligence/
├── apps/
│   └── web/               # Next.js 14 frontend
├── services/
│   ├── api/               # FastAPI backend
│   └── agents/            # LangGraph multi-agent system (Phase 3)
├── supabase/
│   └── migrations/        # SQL schema migrations
├── docker-compose.yml     # Full local stack
├── .env.example           # Environment template
└── ARCHITECTURE.md        # Full system design document
```

---

## Development Phases

| Phase | Focus | Status |
|---|---|---|
| 0 | Foundation scaffold | ✅ Done |
| 1 | Brand Brain (RAG + knowledge ingestion) | 🔜 Next |
| 2 | Content Intelligence (strategy → calendar → content) | ⏳ |
| 3 | Multi-Agent System (5 core agents) | ⏳ |
| 4 | Publishing (social media APIs) | ⏳ |
| 5 | Analytics Brain | ⏳ |

---

## Environment Variables

See [`.env.example`](.env.example) for the full list.

Required to start:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- One of: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

---

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the complete system design including database schema, API contract, agent design, and 10-phase roadmap.
