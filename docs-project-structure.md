# SarkariTrack — Next-Gen Government Job Alert Platform
## Complete Project Directory & Architecture

```
sarkaritrack/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml                  # Local dev: Postgres + Redis + app
│
├── apps/
│   ├── web/                            # Next.js 14 App Router (frontend)
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── postcss.config.js
│   │   ├── package.json
│   │   │
│   │   ├── public/
│   │   │   ├── icons/                  # PWA icons
│   │   │   ├── manifest.json           # PWA manifest
│   │   │   └── robots.txt
│   │   │
│   │   └── src/
│   │       ├── app/                    # Next.js App Router pages
│   │       │   ├── layout.tsx          # Root layout (fonts, analytics)
│   │       │   ├── page.tsx            # / — Homepage hub
│   │       │   ├── sitemap.ts          # Dynamic sitemap generation
│   │       │   ├── robots.ts
│   │       │   │
│   │       │   ├── jobs/
│   │       │   │   └── [job-slug]/
│   │       │   │       ├── page.tsx    # /jobs/[job-slug]
│   │       │   │       └── loading.tsx
│   │       │   │
│   │       │   ├── state/
│   │       │   │   └── [state-name]/
│   │       │   │       └── page.tsx    # /state/[state-name]
│   │       │   │
│   │       │   ├── qualification/
│   │       │   │   └── [degree-slug]/
│   │       │   │       └── page.tsx    # /qualification/[degree-slug]
│   │       │   │
│   │       │   ├── tools/
│   │       │   │   ├── page.tsx        # /tools — tools hub
│   │       │   │   ├── photo-signature-resizer/
│   │       │   │   │   └── page.tsx    # Client-side Canvas tool
│   │       │   │   ├── sarkari-age-calculator/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── smart-eligibility-engine/
│   │       │   │       └── page.tsx
│   │       │   │
│   │       │   ├── admit-cards/
│   │       │   │   ├── page.tsx
│   │       │   │   └── [slug]/page.tsx
│   │       │   │
│   │       │   ├── results/
│   │       │   │   ├── page.tsx
│   │       │   │   └── [slug]/page.tsx
│   │       │   │
│   │       │   └── api/
│   │       │       ├── jobs/route.ts          # GET /api/jobs (filtered)
│   │       │       ├── jobs/[id]/route.ts
│   │       │       ├── search/route.ts        # Typesense autocomplete
│   │       │       ├── eligibility/route.ts
│   │       │       └── subscribe/route.ts     # Web-push subscription
│   │       │
│   │       ├── components/
│   │       │   ├── ui/                        # shadcn/ui base components
│   │       │   │   ├── badge.tsx
│   │       │   │   ├── button.tsx
│   │       │   │   ├── card.tsx
│   │       │   │   ├── dialog.tsx
│   │       │   │   ├── input.tsx
│   │       │   │   ├── select.tsx
│   │       │   │   ├── skeleton.tsx
│   │       │   │   └── table.tsx
│   │       │   │
│   │       │   ├── layout/
│   │       │   │   ├── Header.tsx
│   │       │   │   ├── Footer.tsx
│   │       │   │   ├── BreakingNewsBanner.tsx
│   │       │   │   └── MobileBottomNav.tsx
│   │       │   │
│   │       │   ├── home/
│   │       │   │   ├── HeroSearch.tsx         # Predictive search bar
│   │       │   │   ├── MasterMatrix.tsx       # 4-column hub grid
│   │       │   │   └── MatrixColumn.tsx
│   │       │   │
│   │       │   ├── jobs/
│   │       │   │   ├── JobsDataTable.tsx      # ★ Smart Data Table (main)
│   │       │   │   ├── JobTableFilters.tsx
│   │       │   │   ├── JobStatusBadge.tsx
│   │       │   │   ├── JobDetailSidebar.tsx
│   │       │   │   └── QuickGlanceMatrix.tsx
│   │       │   │
│   │       │   └── tools/
│   │       │       ├── PhotoResizer.tsx
│   │       │       ├── AgeCalculator.tsx
│   │       │       └── EligibilityWizard.tsx
│   │       │
│   │       ├── lib/
│   │       │   ├── prisma.ts                  # Prisma client singleton
│   │       │   ├── redis.ts                   # Redis/Upstash client
│   │       │   ├── typesense.ts               # Search client config
│   │       │   ├── web-push.ts                # Push notification helpers
│   │       │   └── utils.ts
│   │       │
│   │       ├── hooks/
│   │       │   ├── useJobFilters.ts
│   │       │   └── useEligibility.ts
│   │       │
│   │       └── types/
│   │           ├── job.ts
│   │           └── api.ts
│   │
│   └── admin/                          # Internal control panel (Next.js)
│       ├── src/
│       │   ├── app/
│       │   │   ├── dashboard/page.tsx  # Executive dashboard
│       │   │   ├── jobs/
│       │   │   │   ├── page.tsx        # Job CRUD list
│       │   │   │   └── [id]/page.tsx   # Edit individual job
│   │       │   ├── scrapers/page.tsx   # Scraper health monitor
│       │   │   └── links/page.tsx      # Dead-link sentinel view
│       │   └── components/
│       │       ├── AdminDashboard.tsx
│       │       ├── ScraperHealthCard.tsx
│       │       └── RevenueWidget.tsx
│
├── packages/
│   ├── database/                       # Shared Prisma schema & client
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # ★ Master DB schema
│   │   │   └── migrations/
│   │   └── src/
│   │       └── index.ts
│   │
│   └── shared/                         # Shared TypeScript types & utils
│       ├── package.json
│       └── src/
│           ├── types.ts
│           └── constants.ts            # States, qualifications, categories
│
├── services/
│   ├── api/                            # FastAPI backend
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   ├── main.py                     # FastAPI app entry
│   │   ├── routers/
│   │   │   ├── jobs.py
│   │   │   ├── admin.py
│   │   │   └── webhooks.py
│   │   ├── models/
│   │   │   ├── job.py                  # Pydantic models
│   │   │   └── scrape.py
│   │   └── db/
│   │       └── session.py
│   │
│   └── agent/                          # ★ AI Automation Pipeline (Python)
│       ├── requirements.txt
│       ├── Dockerfile
│       ├── main.py                     # Orchestrator entry
│       ├── scrapers/
│       │   ├── base.py
│       │   ├── upsc.py
│       │   ├── ssc.py
│       │   ├── ibps.py
│       │   ├── employment_news.py
│       │   └── state_pscs/
│       │       ├── uppsc.py
│       │       ├── bpsc.py
│       │       └── hpsc.py
│       ├── parsers/
│       │   ├── pdf_parser.py           # ★ AI PDF Ingestion
│       │   └── schema_validator.py
│       ├── publishers/
│       │   ├── whatsapp.py             # Meta Cloud API
│       │   ├── telegram.py             # Telegram Bot API
│       │   └── web_push.py
│       ├── seo/
│       │   └── generator.py            # JSON-LD + meta description
│       └── sentinel/
│           └── link_checker.py         # Dead-link hourly cron
│
└── infrastructure/
    ├── nginx.conf
    ├── crontabs                         # Cron schedule definitions
    └── k8s/                             # Optional Kubernetes manifests
        ├── deployment.yaml
        └── ingress.yaml
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | MPA with ISR/Edge caching |
| Styling | Tailwind CSS + shadcn/ui | Design system |
| Tables | TanStack Table v8 | Smart data tables |
| Search | Typesense (self-hosted) | Predictive search |
| Backend API | FastAPI (Python) | Core REST API |
| ORM | Prisma (Node) / SQLAlchemy (Python) | DB access |
| Database | PostgreSQL 16 | Primary data store |
| Cache | Redis (Upstash for serverless) | Rate-limit, page cache |
| AI Agent | LangChain + GPT-4o / Claude API | PDF parsing automation |
| Scraping | Playwright + BeautifulSoup4 | Portal monitoring |
| Push Notifications | web-push library | Browser push |
| Messaging | Meta Cloud API + Telegram Bot API | Channel notifications |
| Hosting | Vercel (frontend) + Railway/Fly.io (backend) | Deployment |

---

## ISR Cache Strategy

```
/ (homepage)           → revalidate: 300s  (5 min)
/jobs/[slug]           → revalidate: 3600s (1 hr), on-demand invalidation on update
/state/[state]         → revalidate: 1800s (30 min)
/qualification/[slug]  → revalidate: 86400s (24 hr)
/tools/*               → static (client-side only, no revalidation needed)
```
