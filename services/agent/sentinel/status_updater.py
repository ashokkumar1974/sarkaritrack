#!/usr/bin/env python3
"""
SarkariTrack — Status Updater Cron
services/agent/sentinel/status_updater.py

Runs every 30 minutes via cron: */30 * * * *
- Marks jobs as CLOSING_SOON when deadline < 48 hours
- Marks jobs as CLOSED when deadline has passed
- Keeps job statuses always accurate without manual intervention
"""

from __future__ import annotations

import os
import asyncio
import httpx
import structlog
from datetime import datetime, timezone, timedelta

log = structlog.get_logger()

API_BASE   = os.getenv("API_BASE_URL", "http://localhost:8000")
API_KEY    = os.getenv("INTERNAL_API_KEY", "")
CLOSE_THRESHOLD_HOURS = 48


async def run_status_sweep():
    log.info("status_sweep_start")
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{API_BASE}/api/admin/status-sweep",
                headers={"X-API-Key": API_KEY},
                timeout=15,
            )
            r.raise_for_status()
            data = r.json()
            log.info(
                "status_sweep_done",
                closed=data.get("closed", 0),
                marked_closing_soon=data.get("markedClosingSoon", 0),
            )
    except Exception as e:
        log.error("status_sweep_failed", error=str(e))


if __name__ == "__main__":
    asyncio.run(run_status_sweep())


# ============================================================
# services/api/routers/scraper_runs.py
# FastAPI route for scraper run history (add to main.py)
# ============================================================
"""
Add this route to services/api/main.py:

@app.get("/api/admin/scrapers/{scraper_id}/runs", dependencies=[Depends(require_api_key)])
async def get_scraper_runs(scraper_id: str, limit: int = Query(10), db: Session = Depends(get_db)):
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
                "id":          r[0],
                "status":      r[1],
                "startedAt":   r[2].isoformat() if r[2] else None,
                "finishedAt":  r[3].isoformat() if r[3] else None,
                "jobsFound":   r[4] or 0,
                "jobsCreated": r[5] or 0,
                "jobsSkipped": r[6] or 0,
                "pdfsParsed":  r[7] or 0,
                "errorLog":    r[8],
            }
            for r in rows
        ]
    }
"""
