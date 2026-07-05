-- ============================================================
-- PRISMA MIGRATION — Add missing sourceChecksum column
-- Run: npx prisma db execute --file fix-schema.sql
-- OR:  npx prisma migrate dev --name add_source_checksum
-- ============================================================

-- Add sourceChecksum column (for scraper deduplication)
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "sourceChecksum" TEXT;

CREATE INDEX IF NOT EXISTS "Job_sourceChecksum_idx"
  ON "Job" ("sourceChecksum")
  WHERE "sourceChecksum" IS NOT NULL;

-- Add viewCount and applyClickCount defaults (in case missing)
ALTER TABLE "Job"
  ALTER COLUMN "viewCount"        SET DEFAULT 0,
  ALTER COLUMN "applyClickCount"  SET DEFAULT 0;

-- Add isNational default
ALTER TABLE "Job"
  ALTER COLUMN "isNational" SET DEFAULT true;

-- Add isManualEntry default
ALTER TABLE "Job"
  ALTER COLUMN "isManualEntry" SET DEFAULT false;

-- RevenueSnapshot date unique index (fixes ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS "RevenueSnapshot_date_key"
  ON "RevenueSnapshot" (date);

-- ExternalLink unique index (fixes ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalLink_jobId_linkType_key"
  ON "ExternalLink" ("jobId", "linkType");

-- ScraperSource unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "ScraperSource_slug_key"
  ON "ScraperSource" (slug);
CREATE UNIQUE INDEX IF NOT EXISTS "ScraperSource_name_key"
  ON "ScraperSource" (name);

-- Full text search index on jobs (improves search speed)
CREATE INDEX IF NOT EXISTS "Job_title_search_idx"
  ON "Job" USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS "Job_dept_search_idx"
  ON "Job" USING gin(to_tsvector('english', department));

-- Composite index for common homepage query
CREATE INDEX IF NOT EXISTS "Job_status_postType_idx"
  ON "Job" (status, "postType");

-- Index for deadline-based queries
CREATE INDEX IF NOT EXISTS "Job_applicationEndDate_status_idx"
  ON "Job" ("applicationEndDate", status)
  WHERE status IN ('LIVE', 'CLOSING_SOON');


-- ============================================================
-- packages/database/prisma/schema.prisma ADDITION
-- Add sourceChecksum field to Job model
-- (Add this line inside the Job model, after aiParseConfidence)
-- ============================================================
-- aiParseConfidence     Float?
-- sourceChecksum        String?          ← ADD THIS LINE
--
-- Then run: npx prisma generate
-- ============================================================


-- ============================================================
-- VERCEL BUILD FIX
-- apps/web/package.json — add postinstall script
-- This ensures Prisma client is generated after npm install
-- ============================================================
-- Add to scripts in apps/web/package.json:
-- "postinstall": "prisma generate",
-- "build": "prisma generate && next build"
--
-- Also add to apps/web/package.json dependencies:
-- "prisma": "^5.x"
-- "@prisma/client": "^5.x"
-- ============================================================
