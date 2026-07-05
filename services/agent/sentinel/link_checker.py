#!/usr/bin/env python3
"""
SarkariTrack — Dead-Link Sentinel
services/agent/sentinel/link_checker.py

Runs every hour via cron: 0 * * * * python link_checker.py
- Pings all external links stored in ExternalLink table
- Updates link status (OK / DOWN / REDIRECT)
- When a link goes DOWN, triggers frontend label change via API
- Sends admin alert (Telegram) for newly downed links
- Auto-retries links that were DOWN to detect recovery
"""

from __future__ import annotations

import asyncio
import os
import httpx
import structlog
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional

log = structlog.get_logger()

API_BASE        = os.getenv("API_BASE_URL", "http://localhost:8000")
API_KEY         = os.getenv("INTERNAL_API_KEY", "")
TELEGRAM_TOKEN  = os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_CHAT_ID   = os.getenv("TELEGRAM_ADMIN_CHAT_ID", "")   # personal admin chat, not public channel
CHECK_TIMEOUT   = 12          # seconds per link
MAX_CONCURRENCY = 20          # parallel checks
RETRY_AFTER_HOURS = 1         # re-check DOWN links every run
ALERT_THRESHOLD_SECONDS = 300 # only alert if down > 5 minutes (avoid transient blips)


# ──────────────────────────────────────────────
# Data types
# ──────────────────────────────────────────────

@dataclass
class LinkRecord:
    id: str
    job_id: str
    job_title: str
    job_slug: str
    url: str
    link_type: str            # "apply_online" | "notification_pdf" | "official_portal"
    current_status: str       # "OK" | "DOWN" | "REDIRECT" | "UNKNOWN"
    down_since: Optional[str]
    check_count: int


@dataclass
class CheckResult:
    link_id: str
    new_status: str           # "OK" | "DOWN" | "REDIRECT"
    http_status: Optional[int]
    is_newly_down: bool
    is_recovered: bool


# ──────────────────────────────────────────────
# Fetch links from API
# ──────────────────────────────────────────────

async def fetch_links_to_check(client: httpx.AsyncClient) -> list[LinkRecord]:
    """Retrieve all external links that need checking."""
    try:
        r = await client.get(
            f"{API_BASE}/api/admin/external-links",
            params={"status": "all", "limit": 2000},
            headers={"X-API-Key": API_KEY},
            timeout=15,
        )
        r.raise_for_status()
        records = r.json().get("links", [])
        return [
            LinkRecord(
                id=rec["id"],
                job_id=rec["jobId"],
                job_title=rec["jobTitle"],
                job_slug=rec["jobSlug"],
                url=rec["url"],
                link_type=rec["linkType"],
                current_status=rec["status"],
                down_since=rec.get("downSince"),
                check_count=rec.get("checkCount", 0),
            )
            for rec in records
            if rec.get("url")
        ]
    except Exception as e:
        log.error("fetch_links_failed", error=str(e))
        return []


# ──────────────────────────────────────────────
# Check a single link
# ──────────────────────────────────────────────

async def check_link(
    link: LinkRecord,
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
) -> CheckResult:
    async with semaphore:
        new_status = "DOWN"
        http_status: Optional[int] = None

        try:
            # HEAD first (cheaper), fall back to GET if rejected
            try:
                resp = await client.head(
                    link.url,
                    follow_redirects=True,
                    timeout=CHECK_TIMEOUT,
                )
                http_status = resp.status_code
            except httpx.HTTPStatusError:
                resp = await client.get(
                    link.url,
                    follow_redirects=True,
                    timeout=CHECK_TIMEOUT,
                )
                http_status = resp.status_code

            if 200 <= http_status < 400:
                new_status = "OK"
            elif http_status in (301, 302, 307, 308):
                new_status = "REDIRECT"
            else:
                new_status = "DOWN"

        except (httpx.TimeoutException, httpx.ConnectError, httpx.RemoteProtocolError):
            new_status = "DOWN"
            http_status = None
        except Exception as e:
            log.warning("check_error", url=link.url[:60], error=str(e))
            new_status = "DOWN"

        was_ok   = link.current_status in ("OK", "REDIRECT", "UNKNOWN")
        was_down = link.current_status == "DOWN"

        is_newly_down = (new_status == "DOWN") and was_ok
        is_recovered  = (new_status in ("OK", "REDIRECT")) and was_down

        log.debug(
            "link_checked",
            url=link.url[:60],
            prev=link.current_status,
            new=new_status,
            http=http_status,
        )

        return CheckResult(
            link_id=link.id,
            new_status=new_status,
            http_status=http_status,
            is_newly_down=is_newly_down,
            is_recovered=is_recovered,
        )


# ──────────────────────────────────────────────
# Persist results back to API
# ──────────────────────────────────────────────

async def update_link_status(
    client: httpx.AsyncClient,
    result: CheckResult,
) -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    payload: dict = {
        "status": result.new_status,
        "httpStatus": result.http_status,
        "lastCheckedAt": now_iso,
    }
    if result.new_status == "OK":
        payload["lastOkAt"]    = now_iso
        payload["downSince"]   = None
    elif result.is_newly_down:
        payload["downSince"]   = now_iso

    try:
        await client.patch(
            f"{API_BASE}/api/admin/external-links/{result.link_id}",
            json=payload,
            headers={"X-API-Key": API_KEY},
            timeout=10,
        )
    except Exception as e:
        log.warning("update_link_failed", link_id=result.link_id, error=str(e))


# ──────────────────────────────────────────────
# Admin Telegram alert
# ──────────────────────────────────────────────

async def send_admin_alert(client: httpx.AsyncClient, message: str) -> None:
    if not TELEGRAM_TOKEN or not ADMIN_CHAT_ID:
        return
    try:
        await client.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={
                "chat_id": ADMIN_CHAT_ID,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
            timeout=10,
        )
    except Exception as e:
        log.warning("admin_alert_failed", error=str(e))


def format_down_alert(link: LinkRecord, result: CheckResult) -> str:
    site_url = os.getenv("SITE_BASE_URL", "https://sarkaritrack.in")
    return (
        f"🔴 <b>Dead Link Detected</b>\n\n"
        f"📋 Job: <a href=\"{site_url}/jobs/{link.job_slug}\">{link.job_title[:60]}</a>\n"
        f"🔗 Type: <code>{link.link_type}</code>\n"
        f"❌ Status: HTTP {result.http_status or 'Timeout'}\n"
        f"🌐 URL: <code>{link.url[:80]}</code>\n\n"
        f"⚙️ <a href=\"{site_url.replace('sarkaritrack.in', 'admin.sarkaritrack.in')}/jobs/{link.job_slug}/edit\">Fix in Admin Panel →</a>"
    )


def format_recovery_alert(link: LinkRecord) -> str:
    return (
        f"✅ <b>Link Recovered</b>\n\n"
        f"📋 Job: {link.job_title[:60]}\n"
        f"🔗 Type: <code>{link.link_type}</code>\n"
        f"🌐 URL: <code>{link.url[:80]}</code>"
    )


# ──────────────────────────────────────────────
# Main sentinel run
# ──────────────────────────────────────────────

async def run_sentinel():
    log.info("sentinel_start")
    start = datetime.now(timezone.utc)
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async with httpx.AsyncClient(
        follow_redirects=True,
        headers={"User-Agent": "SarkariTrack-LinkSentinel/1.0"},
    ) as client:

        # 1. Fetch all links
        links = await fetch_links_to_check(client)
        log.info("links_to_check", count=len(links))

        if not links:
            log.info("no_links_found")
            return

        # 2. Check all links concurrently
        tasks = [check_link(link, client, semaphore) for link in links]
        results: list[CheckResult] = await asyncio.gather(*tasks, return_exceptions=False)

        # 3. Build a map for easy lookup
        link_map = {l.id: l for l in links}

        # 4. Persist results & send alerts
        stats = {"ok": 0, "down": 0, "redirect": 0, "newly_down": 0, "recovered": 0}
        alert_tasks = []

        for result in results:
            link = link_map.get(result.link_id)
            if not link:
                continue

            # Count stats
            if result.new_status == "OK":        stats["ok"] += 1
            elif result.new_status == "DOWN":    stats["down"] += 1
            elif result.new_status == "REDIRECT":stats["redirect"] += 1

            if result.is_newly_down:
                stats["newly_down"] += 1
                alert_tasks.append(
                    send_admin_alert(client, format_down_alert(link, result))
                )

            if result.is_recovered:
                stats["recovered"] += 1
                alert_tasks.append(
                    send_admin_alert(client, format_recovery_alert(link))
                )

            # Persist status update
            await update_link_status(client, result)

        # 5. Fire all alerts
        if alert_tasks:
            await asyncio.gather(*alert_tasks, return_exceptions=True)

        elapsed = (datetime.now(timezone.utc) - start).total_seconds()
        log.info(
            "sentinel_complete",
            elapsed_s=round(elapsed, 1),
            **stats,
        )

        # 6. Send daily summary if newly_down > 0
        if stats["newly_down"] > 0:
            summary = (
                f"⚠️ <b>SarkariTrack Link Check Summary</b>\n\n"
                f"✅ OK: {stats['ok']}\n"
                f"🔴 Down: {stats['down']}\n"
                f"🔄 Redirect: {stats['redirect']}\n"
                f"🆕 Newly Down: {stats['newly_down']}\n"
                f"💚 Recovered: {stats['recovered']}\n"
                f"⏱ Elapsed: {elapsed:.0f}s"
            )
            await send_admin_alert(client, summary)


# ──────────────────────────────────────────────
# Crontab schedule
# ──────────────────────────────────────────────
# Add to /etc/cron.d/sarkaritrack or crontabs file:
#
# Run scraper pipeline daily at 6:00 AM IST (00:30 UTC)
# 30 0 * * * cd /app/services/agent && python main.py --scraper all >> /var/log/scraper.log 2>&1
#
# Run link sentinel every hour
# 0 * * * * cd /app/services/agent && python sentinel/link_checker.py >> /var/log/sentinel.log 2>&1
#
# Run closing-soon status updater every 30 minutes
# */30 * * * * cd /app/services/agent && python sentinel/status_updater.py >> /var/log/status.log 2>&1


if __name__ == "__main__":
    asyncio.run(run_sentinel())
