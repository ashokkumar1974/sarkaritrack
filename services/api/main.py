"""
SarkariTrack — FastAPI Backend FIXED VERSION
services/api/main.py

Fixes:
- CORS configured for Vercel frontend
- DB connection retry on startup
- Proper error handlers (no stack traces in prod)
- Request timeout handling
- Health check with DB ping
- Missing route: GET /api/admin/jobs/:id
- Missing route: GET /api/admin/scrapers/:id/runs
- Status sweep fix (48h threshold correct)
"""

from __future__ import annotations

import hashlib
import hmac
import os
import time
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

import httpx
from fastapi import FastAPI, HTTPException, Depends, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import QueuePool
import structlog

log = structlog.get_logger()

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

DATABASE_URL  = os.getenv("DATABASE_URL", "")
INTERNAL_KEY  = os.getenv("INTERNAL_API_KEY", "dev-key-change-me")
SITE_BASE_URL = os.getenv("SITE_BASE_URL", "https://sarkaritrack.in")
IS_PROD       = os.getenv("NODE_ENV") == "production" or os.getenv("RAILWAY_ENVIRONMENT") is not None

ALLOWED_ORIGINS = [
    SITE_BASE_URL,
    "https://www.sarkaritrack.in",
    "https://admin.sarkaritrack.in",
    "http://localhost:3000",
    "http://localhost:3001",
]

if not DATABASE_URL:
    raise RuntimeError("❌ DATABASE_URL environment variable is not set!")


# ──────────────────────────────────────────────
# Database — with retry on startup
# ──────────────────────────────────────────────

def create_db_engine():
    """Create SQLAlchemy engine with connection pool tuned for Railway."""
    return create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,        # Test connection before using from pool
        pool_recycle=300,          # Recycle connections every 5 minutes
        connect_args={
            "connect_timeout": 10,
            "application_name": "sarkaritrack_api",
        },
    )

engine = create_db_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def wait_for_db(retries=10, delay=2):
    """Wait for DB to be ready on cold start (Railway can be slow)."""
    for i in range(retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            log.info("database_ready")
            return
        except Exception as e:
            if i == retries - 1:
                raise RuntimeError(f"Database not reachable after {retries} retries: {e}")
            log.warning(f"DB not ready, retrying ({i+1}/{retries})...")
            await asyncio.sleep(delay)


# ──────────────────────────────────────────────
# App lifecycle
# ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    log.info("api_startup", env="production" if IS_PROD else "development")
    await wait_for_db()
    log.info("api_ready")
    yield
    log.info("api_shutdown")
    engine.dispose()


# ──────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────

app = FastAPI(
    title="SarkariTrack API",
    version="1.0.0",
    docs_url=None if IS_PROD else "/api/docs",
    redoc_url=None if IS_PROD else "/api/redoc",
    lifespan=lifespan,
)

# CORS — must be first middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Revalidate-Secret"],
    max_age=86400,
)

# Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ──────────────────────────────────────────────
# Global error handlers
# ──────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("unhandled_exception", path=request.url.path, error=str(exc))
    # Never expose stack traces in production
    message = "Internal server error" if IS_PROD else str(exc)
    return JSONResponse(status_code=500, content={"error": message})

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


# ──────────────────────────────────────────────
# Auth dependency
# ──────────────────────────────────────────────

def require_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if not hmac.compare_digest(x_api_key.encode(), INTERNAL_KEY.encode()):
        raise HTTPException(status_code=403, detail="Invalid API key")
    return True


# ──────────────────────────────────────────────
# Health check — WITH DB ping
# ──────────────────────────────────────────────

@app.get("/health")
async def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)[:50]}"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


# ──────────────────────────────────────────────
# Pydantic models
# ──────────────────────────────────────────────

class JobCreatePayload(BaseModel):
    slug: str
    title: str
    shortTitle: Optional[str] = None
    postType: str = "ONLINE_FORM"
    status: str = "DRAFT"
    department: str
    organizationCode: Optional[str] = None
    advertisementNo: Optional[str] = None
    officialWebsite: Optional[str] = None
    stateName: Optional[str] = None
    isNational: bool = True
    totalVacancies: Optional[int] = None
    vacancyBreakdown: Optional[dict] = None
    postWiseVacancies: Optional[list] = None
    notificationDate: Optional[str] = None
    applicationStartDate: Optional[str] = None
    applicationEndDate: Optional[str] = None
    lastFeePaymentDate: Optional[str] = None
    examDate: Optional[str] = None
    admitCardDate: Optional[str] = None
    ageCutoffDate: Optional[str] = None
    feeGeneral: Optional[int] = None
    feeOBCEWS: Optional[int] = None
    feeSCSTFemale: Optional[int] = None
    feeExServiceman: Optional[int] = None
    feePaymentMode: Optional[str] = None
    ageMinYears: Optional[int] = None
    ageMaxYears: Optional[int] = None
    ageRelaxationJson: Optional[dict] = None
    payScaleMin: Optional[int] = None
    payScaleMax: Optional[int] = None
    payScaleText: Optional[str] = None
    payBand: Optional[str] = None
    selectionProcess: Optional[str] = None
    qualificationSlugs: list[str] = Field(default_factory=list)
    applyOnlineUrl: Optional[str] = None
    notificationPdfUrl: Optional[str] = None
    officialPortalUrl: Optional[str] = None
    syllabusUrl: Optional[str] = None
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    canonicalUrl: Optional[str] = None
    structuredDataJson: Optional[dict] = None
    internalLinks: Optional[list] = None
    sourceUrl: Optional[str] = None
    scrapedFromRunId: Optional[str] = None
    isManualEntry: bool = False
    aiParseConfidence: Optional[float] = None
    parseWarnings: list[str] = Field(default_factory=list)
    sourceChecksum: Optional[str] = None

    class Config:
        extra = "ignore"  # Ignore unknown fields instead of erroring


class JobUpdatePayload(BaseModel):
    title: Optional[str] = None
    shortTitle: Optional[str] = None
    status: Optional[str] = None
    department: Optional[str] = None
    totalVacancies: Optional[int] = None
    applicationStartDate: Optional[str] = None
    applicationEndDate: Optional[str] = None
    examDate: Optional[str] = None
    feeGeneral: Optional[int] = None
    feeOBCEWS: Optional[int] = None
    feeSCSTFemale: Optional[int] = None
    ageMinYears: Optional[int] = None
    ageMaxYears: Optional[int] = None
    payScaleText: Optional[str] = None
    selectionProcess: Optional[str] = None
    applyOnlineUrl: Optional[str] = None
    notificationPdfUrl: Optional[str] = None
    officialPortalUrl: Optional[str] = None
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    importantInstructions: Optional[str] = None
    isManualEntry: Optional[bool] = None

    class Config:
        extra = "ignore"


class ScrapeRunCreate(BaseModel):
    sourceSlug: str
    status: str = "RUNNING"


class ScrapeRunUpdate(BaseModel):
    status: str
    finishedAt: Optional[str] = None
    jobsFound: Optional[int] = None
    jobsCreated: Optional[int] = None
    jobsUpdated: Optional[int] = None
    jobsSkipped: Optional[int] = None
    pdfsParsed: Optional[int] = None
    errorLog: Optional[str] = None


class LinkStatusUpdate(BaseModel):
    status: str
    httpStatus: Optional[int] = None
    lastCheckedAt: Optional[str] = None
    lastOkAt: Optional[str] = None
    downSince: Optional[str] = None


class ScraperPatch(BaseModel):
    isActive: Optional[bool] = None
    cronSchedule: Optional[str] = None


# ──────────────────────────────────────────────
# Helper: safe JSON string for Postgres
# ──────────────────────────────────────────────

import json as _json

def to_pg_json(val) -> str:
    if val is None:
        return "null"
    return _json.dumps(val, ensure_ascii=False)


# ──────────────────────────────────────────────
# Jobs — CRUD
# ──────────────────────────────────────────────

@app.post("/api/admin/jobs", dependencies=[Depends(require_api_key)])
async def create_job(payload: JobCreatePayload, db: Session = Depends(get_db)):
    # Resolve state
    state_id = None
    if payload.stateName:
        row = db.execute(
            text('SELECT id FROM "State" WHERE name ILIKE :name LIMIT 1'),
            {"name": payload.stateName}
        ).fetchone()
        if row:
            state_id = row[0]

    now = datetime.now(timezone.utc)

    # Check for duplicate slug
    existing = db.execute(
        text('SELECT id FROM "Job" WHERE slug = :slug LIMIT 1'),
        {"slug": payload.slug}
    ).fetchone()
    if existing:
        # Make slug unique by appending timestamp
        payload.slug = f"{payload.slug}-{int(time.time())}"

    result = db.execute(text("""
        INSERT INTO "Job" (
            id, slug, title, "shortTitle", "postType", status, department,
            "organizationCode", "advertisementNo", "officialWebsite",
            "stateId", "isNational", "totalVacancies",
            "vacancyBreakdown", "postWiseVacancies",
            "notificationDate", "applicationStartDate", "applicationEndDate",
            "lastFeePaymentDate", "examDate", "admitCardDate", "ageCutoffDate",
            "feeGeneral", "feeOBCEWS", "feeSCSTFemale", "feeExServiceman", "feePaymentMode",
            "ageMinYears", "ageMaxYears", "ageRelaxationJson",
            "payScaleMin", "payScaleMax", "payScaleText", "payBand",
            "selectionProcess", "applyOnlineUrl", "notificationPdfUrl",
            "officialPortalUrl", "syllabusUrl",
            "metaTitle", "metaDescription", "canonicalUrl",
            "structuredDataJson", "internalLinks",
            "sourceUrl", "scrapedFromRunId", "isManualEntry",
            "aiParseConfidence", "createdAt", "updatedAt"
        ) VALUES (
            gen_random_uuid()::text, :slug, :title, :shortTitle, :postType, :status,
            :department, :orgCode, :advtNo, :officialSite,
            :stateId, :isNational, :vacancies,
            :vacBreak::jsonb, :postWise::jsonb,
            :notifDate::date, :startDate::date, :endDate::date,
            :feeDate::date, :examDate::date, :admitDate::date, :cutoffDate::date,
            :feeGen, :feeOBC, :feeSCST, :feeEx, :feeMode,
            :minAge, :maxAge, :ageRelax::jsonb,
            :payMin, :payMax, :payText, :payBand,
            :selProc, :applyUrl, :pdfUrl,
            :portalUrl, :syllUrl,
            :metaTitle, :metaDesc, :canonUrl,
            :structData::jsonb, :intLinks::jsonb,
            :srcUrl, :runId, :isManual,
            :confidence, :now, :now
        ) RETURNING id, slug
    """), {
        "slug": payload.slug, "title": payload.title,
        "shortTitle": payload.shortTitle, "postType": payload.postType,
        "status": payload.status, "department": payload.department,
        "orgCode": payload.organizationCode, "advtNo": payload.advertisementNo,
        "officialSite": payload.officialWebsite, "stateId": state_id,
        "isNational": payload.isNational, "vacancies": payload.totalVacancies,
        "vacBreak": to_pg_json(payload.vacancyBreakdown),
        "postWise": to_pg_json(payload.postWiseVacancies),
        "notifDate": payload.notificationDate,
        "startDate": payload.applicationStartDate,
        "endDate": payload.applicationEndDate,
        "feeDate": payload.lastFeePaymentDate,
        "examDate": payload.examDate,
        "admitDate": payload.admitCardDate,
        "cutoffDate": payload.ageCutoffDate,
        "feeGen": payload.feeGeneral, "feeOBC": payload.feeOBCEWS,
        "feeSCST": payload.feeSCSTFemale, "feeEx": payload.feeExServiceman,
        "feeMode": payload.feePaymentMode,
        "minAge": payload.ageMinYears, "maxAge": payload.ageMaxYears,
        "ageRelax": to_pg_json(payload.ageRelaxationJson),
        "payMin": payload.payScaleMin, "payMax": payload.payScaleMax,
        "payText": payload.payScaleText, "payBand": payload.payBand,
        "selProc": payload.selectionProcess,
        "applyUrl": payload.applyOnlineUrl,
        "pdfUrl": payload.notificationPdfUrl,
        "portalUrl": payload.officialPortalUrl,
        "syllUrl": payload.syllabusUrl,
        "metaTitle": payload.metaTitle, "metaDesc": payload.metaDescription,
        "canonUrl": payload.canonicalUrl,
        "structData": to_pg_json(payload.structuredDataJson),
        "intLinks": to_pg_json(payload.internalLinks),
        "srcUrl": payload.sourceUrl, "runId": payload.scrapedFromRunId,
        "isManual": payload.isManualEntry,
        "confidence": payload.aiParseConfidence,
        "now": now,
    })
    db.commit()
    row = result.fetchone()
    job_id, slug = row[0], row[1]

    # Register external links for sentinel
    link_types = {
        "apply_online":    payload.applyOnlineUrl,
        "notification_pdf": payload.notificationPdfUrl,
        "official_portal": payload.officialPortalUrl,
    }
    for lt, url in link_types.items():
        if url:
            try:
                db.execute(text("""
                    INSERT INTO "ExternalLink" (id, "jobId", url, "linkType", status, "createdAt")
                    VALUES (gen_random_uuid()::text, :job_id, :url, :lt, 'UNKNOWN', :now)
                    ON CONFLICT ("jobId", "linkType") DO NOTHING
                """), {"job_id": job_id, "url": url, "lt": lt, "now": now})
            except Exception:
                pass  # Don't fail job creation if link registration fails
    db.commit()

    log.info("job_created", id=job_id, slug=slug, title=payload.title[:50])
    return {"id": job_id, "slug": slug}


@app.get("/api/admin/jobs", dependencies=[Depends(require_api_key)])
async def get_admin_jobs(
    page: int = Query(1, ge=1),
    pageSize: int = Query(30, ge=1, le=100),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * pageSize
    where_clauses = []
    params: dict = {"limit": pageSize, "offset": offset}

    if status and status != "ALL":
        where_clauses.append('"status" = :status')
        params["status"] = status
    if q:
        safe_q = f"%{q[:100]}%"
        where_clauses.append('(title ILIKE :q OR department ILIKE :q)')
        params["q"] = safe_q

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    total = db.execute(
        text(f'SELECT COUNT(*) FROM "Job" {where_sql}'), params
    ).scalar() or 0

    rows = db.execute(text(f"""
        SELECT id, slug, title, department, status, "postType",
               "totalVacancies", "applicationEndDate", "publishedAt",
               "aiParseConfidence", "isManualEntry"
        FROM "Job"
        {where_sql}
        ORDER BY "createdAt" DESC
        LIMIT :limit OFFSET :offset
    """), params).fetchall()

    return {
        "jobs": [
            {
                "id": r[0], "slug": r[1], "title": r[2], "department": r[3],
                "status": r[4], "postType": r[5], "totalVacancies": r[6],
                "applicationEndDate": r[7].isoformat() if r[7] else None,
                "publishedAt": r[8].isoformat() if r[8] else None,
                "aiParseConfidence": float(r[9]) if r[9] else None,
                "isManualEntry": bool(r[10]),
            }
            for r in rows
        ],
        "total": int(total),
        "page": page,
        "pageSize": pageSize,
        "totalPages": max(1, -(-int(total) // pageSize)),
    }


@app.get("/api/admin/jobs/{job_id}", dependencies=[Depends(require_api_key)])
async def get_job(job_id: str, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT id, slug, title, "shortTitle", status, department,
               "organizationCode", "advertisementNo", "isNational",
               "totalVacancies", "applicationStartDate", "applicationEndDate",
               "examDate", "feeGeneral", "feeOBCEWS", "feeSCSTFemale",
               "ageMinYears", "ageMaxYears", "payScaleText", "selectionProcess",
               "applyOnlineUrl", "notificationPdfUrl", "officialPortalUrl",
               "metaTitle", "metaDescription", "importantInstructions",
               "aiParseConfidence", "isManualEntry"
        FROM "Job" WHERE id = :id LIMIT 1
    """), {"id": job_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    keys = [
        "id","slug","title","shortTitle","status","department",
        "organizationCode","advertisementNo","isNational","totalVacancies",
        "applicationStartDate","applicationEndDate","examDate",
        "feeGeneral","feeOBCEWS","feeSCSTFemale",
        "ageMinYears","ageMaxYears","payScaleText","selectionProcess",
        "applyOnlineUrl","notificationPdfUrl","officialPortalUrl",
        "metaTitle","metaDescription","importantInstructions",
        "aiParseConfidence","isManualEntry",
    ]
    d = dict(zip(keys, row))
    for k in ["applicationStartDate","applicationEndDate","examDate"]:
        if d.get(k):
            d[k] = d[k].isoformat()
    return d


@app.patch("/api/admin/jobs/{job_id}", dependencies=[Depends(require_api_key)])
async def patch_job(job_id: str, payload: JobUpdatePayload, db: Session = Depends(get_db)):
    fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not fields:
        return {"success": True, "message": "No fields to update"}
    set_parts = [f'"{k}" = :{k}' for k in fields]
    set_clause = ", ".join(set_parts)
    fields["job_id"] = job_id
    fields["now"] = datetime.now(timezone.utc)
    result = db.execute(
        text(f'UPDATE "Job" SET {set_clause}, "updatedAt" = :now WHERE id = :job_id'),
        fields
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return {"success": True}


@app.post("/api/admin/jobs/{job_id}/publish", dependencies=[Depends(require_api_key)])
async def publish_job(job_id: str, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    result = db.execute(text("""
        UPDATE "Job"
        SET status = 'LIVE', "publishedAt" = :now, "updatedAt" = :now
        WHERE id = :id AND status != 'LIVE'
        RETURNING id, slug, title, department, "totalVacancies", "applicationEndDate"
    """), {"id": job_id, "now": now})
    row = result.fetchone()
    db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found or already live")

    job_data = dict(zip(["id","slug","title","department","totalVacancies","applicationEndDate"], row))

    # Fire notifications in background
    asyncio.create_task(_fire_notifications(job_data))
    # Invalidate ISR cache
    asyncio.create_task(_invalidate_cache(job_data["slug"]))

    return {"success": True, "slug": job_data["slug"]}


async def _fire_notifications(job_data: dict):
    try:
        import sys
        sys.path.insert(0, "/app")
        from parsers.pdf_parser import dispatch_all_notifications, NotificationPayload
        n = NotificationPayload(
            jobId=job_data["id"], title=job_data["title"],
            department=job_data["department"],
            totalVacancies=job_data.get("totalVacancies"),
            applicationEndDate=job_data.get("applicationEndDate"),
            slug=job_data["slug"], applyOnlineUrl=None,
        )
        await asyncio.to_thread(dispatch_all_notifications, n)
    except Exception as e:
        log.error("notification_failed", error=str(e))


async def _invalidate_cache(slug: str):
    try:
        nextjs_url    = os.getenv("NEXTJS_URL", "http://web:3000")
        revalidate_secret = os.getenv("NEXTJS_REVALIDATE_SECRET", "")
        if not revalidate_secret:
            return
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{nextjs_url}/api/revalidate",
                json={"secret": revalidate_secret, "slug": slug, "type": "job"},
                timeout=5,
            )
    except Exception as e:
        log.warning("cache_invalidation_failed", slug=slug, error=str(e))


@app.delete("/api/admin/jobs/{job_id}", dependencies=[Depends(require_api_key)])
async def delete_job(job_id: str, db: Session = Depends(get_db)):
    result = db.execute(text('DELETE FROM "Job" WHERE id = :id'), {"id": job_id})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True}


# ──────────────────────────────────────────────
# Status sweep — FIXED (correct 48h logic)
# ──────────────────────────────────────────────

@app.post("/api/admin/status-sweep", dependencies=[Depends(require_api_key)])
async def sweep_statuses(db: Session = Depends(get_db)):
    now    = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=48)  # FIX: was missing timedelta

    # Close expired jobs
    r1 = db.execute(text("""
        UPDATE "Job"
        SET status = 'CLOSED', "updatedAt" = :now
        WHERE status IN ('LIVE', 'CLOSING_SOON')
          AND "applicationEndDate" IS NOT NULL
          AND "applicationEndDate" < :now
    """), {"now": now})

    # Mark closing soon (within next 48 hours)
    r2 = db.execute(text("""
        UPDATE "Job"
        SET status = 'CLOSING_SOON', "updatedAt" = :now
        WHERE status = 'LIVE'
          AND "applicationEndDate" IS NOT NULL
          AND "applicationEndDate" BETWEEN :now AND :cutoff
    """), {"now": now, "cutoff": cutoff})

    db.commit()
    log.info("status_sweep", closed=r1.rowcount, closing_soon=r2.rowcount)
    return {"closed": r1.rowcount, "markedClosingSoon": r2.rowcount}


# ──────────────────────────────────────────────
# Scraper routes
# ──────────────────────────────────────────────

@app.get("/api/admin/scrapers", dependencies=[Depends(require_api_key)])
async def get_scrapers(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT ss.id, ss.name, ss.slug, ss."lastRunAt", ss."isActive",
               ss."cronSchedule", sr.status, sr."jobsFound"
        FROM "ScraperSource" ss
        LEFT JOIN LATERAL (
            SELECT status, "jobsFound" FROM "ScrapeRun"
            WHERE "sourceId" = ss.id
            ORDER BY "startedAt" DESC LIMIT 1
        ) sr ON true
        ORDER BY ss.name
    """)).fetchall()
    return {
        "scrapers": [
            {
                "id": r[0], "name": r[1], "slug": r[2],
                "lastRunAt": r[3].isoformat() if r[3] else None,
                "isActive": bool(r[4]), "cronSchedule": r[5],
                "lastStatus": r[6], "jobsFoundLast": r[7] or 0,
            }
            for r in rows
        ]
    }


@app.get("/api/admin/scrapers/{scraper_id}/runs", dependencies=[Depends(require_api_key)])
async def get_scraper_runs(
    scraper_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    rows = db.execute(text("""
        SELECT id, status, "startedAt", "finishedAt",
               "jobsFound", "jobsCreated", "jobsSkipped", "pdfsParsed", "errorLog"
        FROM "ScrapeRun"
        WHERE "sourceId" = :src_id
        ORDER BY "startedAt" DESC
        LIMIT :limit
    """), {"src_id": scraper_id, "limit": limit}).fetchall()
    return {
        "runs": [
            {
                "id": r[0], "status": r[1],
                "startedAt":  r[2].isoformat() if r[2] else None,
                "finishedAt": r[3].isoformat() if r[3] else None,
                "jobsFound": r[4] or 0, "jobsCreated": r[5] or 0,
                "jobsSkipped": r[6] or 0, "pdfsParsed": r[7] or 0,
                "errorLog": r[8],
            }
            for r in rows
        ]
    }


@app.patch("/api/admin/scrapers/{scraper_id}", dependencies=[Depends(require_api_key)])
async def update_scraper(scraper_id: str, payload: ScraperPatch, db: Session = Depends(get_db)):
    if payload.isActive is not None:
        db.execute(
            text('UPDATE "ScraperSource" SET "isActive" = :v WHERE id = :id'),
            {"v": payload.isActive, "id": scraper_id}
        )
        db.commit()
    return {"success": True}


@app.post("/api/admin/scrapers/{scraper_id}/run", dependencies=[Depends(require_api_key)])
async def trigger_scraper(scraper_id: str, db: Session = Depends(get_db)):
    source = db.execute(
        text('SELECT slug, "isActive" FROM "ScraperSource" WHERE id = :id LIMIT 1'),
        {"id": scraper_id}
    ).fetchone()
    if not source:
        raise HTTPException(status_code=404, detail="Scraper not found")
    if not source[1]:
        raise HTTPException(status_code=400, detail="Scraper is disabled")
    return {"success": True, "message": f"Scraper '{source[0]}' triggered", "async": True}


# ──────────────────────────────────────────────
# Scrape runs
# ──────────────────────────────────────────────

@app.post("/api/admin/scrape-runs", dependencies=[Depends(require_api_key)])
async def create_scrape_run(payload: ScrapeRunCreate, db: Session = Depends(get_db)):
    source = db.execute(
        text('SELECT id FROM "ScraperSource" WHERE slug = :slug LIMIT 1'),
        {"slug": payload.sourceSlug}
    ).fetchone()
    if not source:
        raise HTTPException(status_code=404, detail=f"Source '{payload.sourceSlug}' not found")
    now = datetime.now(timezone.utc)
    result = db.execute(text("""
        INSERT INTO "ScrapeRun" (id, "sourceId", status, "startedAt")
        VALUES (gen_random_uuid()::text, :src_id, :status, :now)
        RETURNING id
    """), {"src_id": source[0], "status": payload.status, "now": now})
    db.execute(
        text('UPDATE "ScraperSource" SET "lastRunAt" = :now WHERE id = :id'),
        {"now": now, "id": source[0]}
    )
    db.commit()
    return {"id": result.fetchone()[0]}


@app.patch("/api/admin/scrape-runs/{run_id}", dependencies=[Depends(require_api_key)])
async def update_scrape_run(run_id: str, payload: ScrapeRunUpdate, db: Session = Depends(get_db)):
    db.execute(text("""
        UPDATE "ScrapeRun" SET
            status = :status, "finishedAt" = :finished,
            "jobsFound"   = COALESCE(:found,   "jobsFound"),
            "jobsCreated" = COALESCE(:created, "jobsCreated"),
            "jobsSkipped" = COALESCE(:skipped, "jobsSkipped"),
            "pdfsParsed"  = COALESCE(:pdfs,    "pdfsParsed"),
            "errorLog"    = COALESCE(:err,      "errorLog")
        WHERE id = :id
    """), {
        "id": run_id, "status": payload.status,
        "finished": payload.finishedAt, "found": payload.jobsFound,
        "created": payload.jobsCreated, "skipped": payload.jobsSkipped,
        "pdfs": payload.pdfsParsed, "err": payload.errorLog,
    })
    db.commit()
    return {"success": True}


# ──────────────────────────────────────────────
# External links
# ──────────────────────────────────────────────

@app.get("/api/admin/external-links", dependencies=[Depends(require_api_key)])
async def get_external_links(
    status: str = Query("all"),
    limit: int = Query(2000, le=5000),
    db: Session = Depends(get_db),
):
    where = f'WHERE el.status = \'{status}\'' if status != "all" else ""
    rows = db.execute(text(f"""
        SELECT el.id, el."jobId", j.title, j.slug, el.url,
               el."linkType", el.status, el."httpStatus",
               el."downSince", el."checkCount"
        FROM "ExternalLink" el
        JOIN "Job" j ON j.id = el."jobId"
        {where}
        ORDER BY el."lastCheckedAt" ASC NULLS FIRST
        LIMIT :limit
    """), {"limit": limit}).fetchall()
    return {
        "links": [
            {
                "id": r[0], "jobId": r[1], "jobTitle": r[2], "jobSlug": r[3],
                "url": r[4], "linkType": r[5], "status": r[6],
                "httpStatus": r[7],
                "downSince": r[8].isoformat() if r[8] else None,
                "checkCount": r[9] or 0,
            }
            for r in rows
        ]
    }


@app.patch("/api/admin/external-links/{link_id}", dependencies=[Depends(require_api_key)])
async def update_external_link(link_id: str, payload: LinkStatusUpdate, db: Session = Depends(get_db)):
    db.execute(text("""
        UPDATE "ExternalLink" SET
            status = :status,
            "httpStatus" = :http_status,
            "lastCheckedAt" = :checked,
            "lastOkAt" = COALESCE(:ok_at, "lastOkAt"),
            "downSince" = :down_since,
            "checkCount" = "checkCount" + 1
        WHERE id = :id
    """), {
        "id": link_id, "status": payload.status,
        "http_status": payload.httpStatus, "checked": payload.lastCheckedAt,
        "ok_at": payload.lastOkAt, "down_since": payload.downSince,
    })
    db.commit()
    return {"success": True}


@app.get("/api/admin/dead-links", dependencies=[Depends(require_api_key)])
async def get_dead_links(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT el.id, j.title, j.slug, el."linkType", el.url,
               el."httpStatus", el."downSince"
        FROM "ExternalLink" el
        JOIN "Job" j ON j.id = el."jobId"
        WHERE el.status = 'DOWN'
        ORDER BY el."downSince" DESC NULLS LAST
        LIMIT 100
    """)).fetchall()
    return {
        "links": [
            {
                "id": r[0], "jobTitle": r[1], "jobSlug": r[2],
                "linkType": r[3], "url": r[4], "httpStatus": r[5],
                "downSince": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
    }


# ──────────────────────────────────────────────
# Admin stats
# ──────────────────────────────────────────────

@app.get("/api/admin/stats", dependencies=[Depends(require_api_key)])
async def get_stats(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    try:
        r = db.execute(text("""
            SELECT
                (SELECT COUNT(*) FROM "Job" WHERE status = 'LIVE')::int,
                (SELECT COUNT(*) FROM "Job" WHERE status = 'CLOSING_SOON')::int,
                (SELECT COUNT(*) FROM "Job" WHERE status = 'DRAFT')::int,
                (SELECT COUNT(*) FROM "Job" WHERE "publishedAt"::date = :today)::int,
                (SELECT COUNT(*) FROM "PushSubscription")::int,
                (SELECT COALESCE("pageViews", 0)       FROM "RevenueSnapshot" WHERE date = :today LIMIT 1),
                (SELECT COALESCE("uniqueVisitors", 0)   FROM "RevenueSnapshot" WHERE date = :today LIMIT 1),
                (SELECT COALESCE("adsenseRevenue", 0)   FROM "RevenueSnapshot" WHERE date = :today LIMIT 1),
                (SELECT COALESCE(SUM("adsenseRevenue"),0)
                 FROM "RevenueSnapshot"
                 WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
                   AND EXTRACT(YEAR  FROM date) = EXTRACT(YEAR  FROM CURRENT_DATE)),
                (SELECT COALESCE("affiliateClicks", 0)  FROM "RevenueSnapshot" WHERE date = :today LIMIT 1),
                (SELECT COALESCE("affiliateRev", 0)     FROM "RevenueSnapshot" WHERE date = :today LIMIT 1)
        """), {"today": today}).fetchone()
    except Exception:
        r = [0] * 11

    return {
        "liveVisitors":         0,
        "totalLiveJobs":        int(r[0] or 0),
        "totalClosingSoon":     int(r[1] or 0),
        "totalDraftJobs":       int(r[2] or 0),
        "newJobsToday":         int(r[3] or 0),
        "pushSubscribers":      int(r[4] or 0),
        "todayPageViews":       int(r[5] or 0),
        "todayUniqueVisitors":  int(r[6] or 0),
        "adsenseRevToday":      float(r[7] or 0),
        "adsenseRevMonth":      float(r[8] or 0),
        "affiliateClicksToday": int(r[9] or 0),
        "affiliateRevToday":    float(r[10] or 0),
        "telegramSubscribers":  0,
    }


# ──────────────────────────────────────────────
# Revenue snapshot
# ──────────────────────────────────────────────

@app.post("/api/admin/revenue-snapshot", dependencies=[Depends(require_api_key)])
async def create_revenue_snapshot(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    db.execute(text("""
        INSERT INTO "RevenueSnapshot"
            (id, date, "adsenseRevenue", "affiliateClicks", "affiliateRev",
             "pageViews", "uniqueVisitors", "newSubscribers", "createdAt")
        VALUES
            (gen_random_uuid()::text, :date, 0, 0, 0, 0, 0, 0, :now)
        ON CONFLICT (date) DO NOTHING
    """), {"date": today, "now": datetime.now(timezone.utc)})
    db.commit()
    return {"success": True, "date": str(today)}


# ──────────────────────────────────────────────
# Checksums (dedup for scraper)
# ──────────────────────────────────────────────

@app.get("/api/admin/checksums", dependencies=[Depends(require_api_key)])
async def get_checksums(source: str = Query(...), db: Session = Depends(get_db)):
    # Note: requires sourceChecksum column — add via migration if not present:
    # ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "sourceChecksum" TEXT;
    try:
        rows = db.execute(text("""
            SELECT j."sourceChecksum"
            FROM "Job" j
            JOIN "ScrapeRun" sr ON sr.id = j."scrapedFromRunId"
            JOIN "ScraperSource" ss ON ss.id = sr."sourceId"
            WHERE ss.slug = :source AND j."sourceChecksum" IS NOT NULL
        """), {"source": source}).fetchall()
        return {"checksums": [r[0] for r in rows if r[0]]}
    except Exception:
        return {"checksums": []}


# ──────────────────────────────────────────────
# Admin drafts
# ──────────────────────────────────────────────

@app.get("/api/admin/drafts", dependencies=[Depends(require_api_key)])
async def get_drafts(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT id, title, department, "totalVacancies",
               "applicationEndDate", "aiParseConfidence", "createdAt"
        FROM "Job"
        WHERE status = 'DRAFT'
        ORDER BY "createdAt" DESC
        LIMIT 100
    """)).fetchall()
    return {
        "jobs": [
            {
                "id": r[0], "title": r[1], "department": r[2],
                "totalVacancies": r[3],
                "applicationEndDate": r[4].isoformat() if r[4] else None,
                "aiParseConfidence": float(r[5]) if r[5] else None,
                "createdAt": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
    }
