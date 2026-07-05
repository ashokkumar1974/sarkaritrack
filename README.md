# SarkariTrack — India's #1 Government Job Alert Portal

## Quick Start (3 steps)

### Step 1 — Setup
```bash
cp .env.example .env
# Fill in DATABASE_URL and INTERNAL_API_KEY at minimum
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

### Step 2 — Run locally
```bash
# Terminal 1 — Frontend
cd apps/web && pnpm dev        # → http://localhost:3000

# Terminal 2 — Backend API
cd services/api
uvicorn main:app --reload --port 8000

# Test AI PDF parser
cd services/agent
python3 parsers/pdf_parser.py "https://ssc.gov.in/api/assets/notification.pdf"
```

### Step 3 — Deploy
```bash
# Frontend → Vercel (free)
cd apps/web && npx vercel --prod

# Backend → Railway (~$5/mo)
cd services/api && railway up

# Agent → Railway (~$3/mo)
cd services/agent && railway up
```

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table
- **Backend**: FastAPI (Python), PostgreSQL, Redis
- **AI Agent**: GPT-4o / Claude 3.5 + Playwright + pdfminer
- **Notifications**: Telegram Bot + WhatsApp Cloud API + Web Push

## Folder Structure
```
sarkaritrack/
├── apps/
│   ├── web/          ← Next.js frontend (main site)
│   └── admin/        ← Admin control panel
├── packages/
│   ├── database/     ← Prisma schema + seed
│   └── shared/       ← Shared constants & types
├── services/
│   ├── api/          ← FastAPI backend
│   └── agent/        ← AI scraper + PDF parser + sentinel
└── infrastructure/   ← Nginx config
```

## Important Files
| File | Purpose |
|------|---------|
| `docs-master-reference.md` | Complete deployment guide |
| `docs-fixes-summary.md` | All bug fixes and what they do |
| `.env.example` | All env variables with comments |
| `packages/database/prisma/fix-migration.sql` | Run on production DB |
| `scripts/setup.sh` | One-command local setup |

## Environment Variables Required
See `.env.example` for all variables. Minimum required:
- `DATABASE_URL`
- `INTERNAL_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

## shadcn/ui Setup (Required after install)
```bash
cd apps/web
npx shadcn@latest init
npx shadcn@latest add badge button card dialog input select skeleton table
```

## Daily Operation (5 minutes/day)
1. Open admin.sarkaritrack.in/dashboard
2. Review AI-parsed draft jobs → click Publish
3. Check dead links tab → fix any broken URLs
4. Done. Everything else is automated.

---
Built with ❤️ for India's job seekers
