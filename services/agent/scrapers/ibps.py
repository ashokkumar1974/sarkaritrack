#!/usr/bin/env python3
"""
SarkariTrack — Scraper Orchestrator & Portal Scrapers
services/agent/main.py  +  scrapers/

Directory:
  services/agent/
  ├── main.py              ← this file (orchestrator + cron entry)
  ├── scrapers/
  │   ├── base.py
  │   ├── upsc.py
  │   ├── ssc.py
  │   ├── ibps.py
  │   └── employment_news.py
"""

# ============================================================
# services/agent/scrapers/base.py
# ============================================================

from __future__ import annotations
import abc
import asyncio
import hashlib
import httpx
import structlog
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from playwright.async_api import async_playwright, Page, Browser

log = structlog.get_logger()


@dataclass
class RawListing:
    """Raw scraped item before AI parsing."""
    source_slug: str
    title: str
    pdf_url: Optional[str]
    detail_url: Optional[str]
    raw_date_text: Optional[str]
    checksum: str = field(init=False)

    def __post_init__(self):
        # Deterministic dedup key
        raw = f"{self.source_slug}|{self.title}|{self.pdf_url or self.detail_url}"
        self.checksum = hashlib.sha256(raw.encode()).hexdigest()


class BaseScraper(abc.ABC):
    """Abstract base for all portal scrapers."""

    source_slug: str = ""
    source_name: str = ""
    base_url: str = ""

    def __init__(self, scrape_run_id: str):
        self.scrape_run_id = scrape_run_id
        self.log = structlog.get_logger(scraper=self.source_slug)

    @abc.abstractmethod
    async def scrape(self, page: Page) -> list[RawListing]:
        """Navigate portal and return raw listings."""
        ...

    async def run(self, browser: Browser) -> list[RawListing]:
        """Shared run wrapper: open page, call scrape(), handle errors."""
        page = await browser.new_page()
        await page.set_extra_http_headers({
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
        })
        try:
            self.log.info("scrape_start", url=self.base_url)
            listings = await self.scrape(page)
            self.log.info("scrape_done", count=len(listings))
            return listings
        except Exception as e:
            self.log.error("scrape_failed", error=str(e))
            return []
        finally:
            await page.close()


# ============================================================
# services/agent/scrapers/upsc.py
# ============================================================

class UPSCScraper(BaseScraper):
    source_slug = "upsc"
    source_name = "UPSC Official"
    base_url = "https://upsc.gov.in/recruitment"

    async def scrape(self, page: Page) -> list[RawListing]:
        await page.goto(self.base_url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector("table, .notif-table, ul.notif-list", timeout=15000)

        listings: list[RawListing] = []

        # UPSC uses anchor tags with PDF links inside notification tables
        rows = await page.query_selector_all("a[href$='.pdf'], a[href*='notification'], a[href*='advt']")

        for el in rows:
            try:
                title_raw = await el.inner_text()
                title = title_raw.strip()
                if not title or len(title) < 10:
                    continue

                href = await el.get_attribute("href") or ""
                # Resolve relative URLs
                if href.startswith("/"):
                    href = f"https://upsc.gov.in{href}"

                pdf_url    = href if href.endswith(".pdf") else None
                detail_url = href if not href.endswith(".pdf") else None

                # Try to grab nearby date text
                parent = await el.query_selector("xpath=..")
                date_text = None
                if parent:
                    parent_text = await parent.inner_text()
                    # Crude date extraction — AI will refine
                    import re
                    m = re.search(r"\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}", parent_text)
                    date_text = m.group(0) if m else None

                listings.append(RawListing(
                    source_slug=self.source_slug,
                    title=title,
                    pdf_url=pdf_url,
                    detail_url=detail_url,
                    raw_date_text=date_text,
                ))
            except Exception as e:
                self.log.warning("row_parse_error", error=str(e))
                continue

        # Deduplicate by checksum
        seen: set[str] = set()
        deduped: list[RawListing] = []
        for lst in listings:
            if lst.checksum not in seen:
                seen.add(lst.checksum)
                deduped.append(lst)

        return deduped


# ============================================================
# services/agent/scrapers/ssc.py
# ============================================================

class SSCScraper(BaseScraper):
    source_slug = "ssc"
    source_name = "SSC Official"
    base_url = "https://ssc.gov.in/portal/recruitment"

    async def scrape(self, page: Page) -> list[RawListing]:
        await page.goto(self.base_url, wait_until="networkidle", timeout=40000)

        listings: list[RawListing] = []

        # SSC has a dynamic React/Angular portal; wait for content
        try:
            await page.wait_for_selector(".notif-list, .recruitment-list, table tbody tr", timeout=20000)
        except Exception:
            self.log.warning("ssc_selector_timeout_using_fallback")

        # Scrape all notification links
        links = await page.query_selector_all("a")
        import re

        for el in links:
            try:
                text = (await el.inner_text()).strip()
                href = await el.get_attribute("href") or ""

                # Only process links that look like recruitment notices
                keywords = ["recruitment", "advt", "notification", "vacancy", "examination", "cgl", "chsl", "mts", "gd"]
                if not any(kw in text.lower() or kw in href.lower() for kw in keywords):
                    continue
                if len(text) < 8:
                    continue

                if href.startswith("/"):
                    href = f"https://ssc.gov.in{href}"
                elif not href.startswith("http"):
                    continue

                pdf_url    = href if ".pdf" in href.lower() else None
                detail_url = None if pdf_url else href

                m = re.search(r"\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}", text)
                date_text = m.group(0) if m else None

                listings.append(RawListing(
                    source_slug=self.source_slug,
                    title=text[:300],
                    pdf_url=pdf_url,
                    detail_url=detail_url,
                    raw_date_text=date_text,
                ))
            except Exception:
                continue

        seen: set[str] = set()
        return [l for l in listings if not (l.checksum in seen or seen.add(l.checksum))]


# ============================================================
# services/agent/scrapers/ibps.py
# ============================================================

class IBPSScraper(BaseScraper):
    source_slug = "ibps"
    source_name = "IBPS Official"
    base_url = "https://www.ibps.in"

    async def scrape(self, page: Page) -> list[RawListing]:
        await page.goto(self.base_url, wait_until="domcontentloaded", timeout=30000)

        listings: list[RawListing] = []

        # IBPS homepage has a "Latest News" / "What's New" section
        try:
            await page.wait_for_selector(".whats-new, #whats-new, .latest-news, .ticker", timeout=15000)
        except Exception:
            self.log.warning("ibps_whats_new_not_found")

        # Also check direct recruitment page
        try:
            await page.goto(f"{self.base_url}/recruitment.html", wait_until="domcontentloaded", timeout=20000)
        except Exception:
            pass

        links = await page.query_selector_all("a[href*='.pdf'], a[href*='notification'], a[href*='advt']")

        for el in links:
            try:
                text = (await el.inner_text()).strip()
                href = await el.get_attribute("href") or ""
                if not text or len(text) < 8:
                    continue
                if href.startswith("/"):
                    href = f"https://www.ibps.in{href}"
                pdf_url = href if ".pdf" in href.lower() else None
                listings.append(RawListing(
                    source_slug=self.source_slug,
                    title=text[:300],
                    pdf_url=pdf_url,
                    detail_url=None if pdf_url else href,
                    raw_date_text=None,
                ))
            except Exception:
                continue

        seen: set[str] = set()
        return [l for l in listings if not (l.checksum in seen or seen.add(l.checksum))]


# ============================================================
# services/agent/scrapers/employment_news.py
# ============================================================

class EmploymentNewsScraper(BaseScraper):
    """
    Scrapes the Employment News / Rozgar Samachar weekly digest
    which aggregates central government job notifications.
    """
    source_slug = "employment_news"
    source_name = "Employment News"
    base_url = "https://www.employmentnews.gov.in/NewEmp/Home.aspx"

    async def scrape(self, page: Page) -> list[RawListing]:
        await page.goto(self.base_url, wait_until="domcontentloaded", timeout=30000)

        listings: list[RawListing] = []

        # Employment News has an ASP.NET grid of adverts
        try:
            await page.wait_for_selector("table.GridView, #gvAdvt, .advert-list", timeout=20000)
        except Exception:
            self.log.warning("employment_news_table_not_found")

        rows = await page.query_selector_all("tr")
        for row in rows[1:]:  # skip header row
            try:
                cells = await row.query_selector_all("td")
                if len(cells) < 3:
                    continue
                texts = [((await c.inner_text()).strip()) for c in cells]
                title = texts[1] if len(texts) > 1 else texts[0]
                date_text = texts[-1] if texts else None
                link_el = await row.query_selector("a")
                href = ""
                if link_el:
                    href = await link_el.get_attribute("href") or ""
                if href.startswith("/"):
                    href = f"https://www.employmentnews.gov.in{href}"
                if not title or len(title) < 8:
                    continue
                listings.append(RawListing(
                    source_slug=self.source_slug,
                    title=title[:300],
                    pdf_url=href if ".pdf" in href.lower() else None,
                    detail_url=href if ".pdf" not in href.lower() and href else None,
                    raw_date_text=date_text,
                ))
            except Exception:
                continue

        seen: set[str] = set()
        return [l for l in listings if not (l.checksum in seen or seen.add(l.checksum))]


# ============================================================
# services/agent/scrapers/state_pscs/uppsc.py
# ============================================================

class UPPSCScraper(BaseScraper):
    source_slug = "uppsc"
    source_name = "UPPSC Official"
    base_url = "https://uppsc.up.nic.in"

    async def scrape(self, page: Page) -> list[RawListing]:
        await page.goto(f"{self.base_url}/Pages/Public/DynamicPage.aspx?Id=1", wait_until="domcontentloaded", timeout=30000)
        listings: list[RawListing] = []
        links = await page.query_selector_all("a[href*='.pdf'], a[href*='advt'], a[href*='notice']")
        for el in links:
            try:
                text = (await el.inner_text()).strip()
                href = await el.get_attribute("href") or ""
                if not text or len(text) < 8: continue
                if not href.startswith("http"):
                    href = f"{self.base_url}/{href.lstrip('/')}"
                listings.append(RawListing(
                    source_slug=self.source_slug,
                    title=text[:300],
                    pdf_url=href if ".pdf" in href.lower() else None,
                    detail_url=href if ".pdf" not in href.lower() else None,
                    raw_date_text=None,
                ))
            except Exception:
                continue
        seen: set[str] = set()
        return [l for l in listings if not (l.checksum in seen or seen.add(l.checksum))]


# ============================================================
# services/agent/main.py — ORCHESTRATOR
# ============================================================

import os
import asyncio
import httpx
import structlog
from datetime import datetime
from parsers.pdf_parser import parse_recruitment_pdf, dispatch_all_notifications, NotificationPayload

log = structlog.get_logger()

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
API_KEY  = os.getenv("INTERNAL_API_KEY", "")

SCRAPER_REGISTRY = {
    "upsc":            UPSCScraper,
    "ssc":             SSCScraper,
    "ibps":            IBPSScraper,
    "employment_news": EmploymentNewsScraper,
    "uppsc":           UPPSCScraper,
}


async def get_known_checksums(source_slug: str) -> set[str]:
    """Fetch checksums of already-ingested jobs for this source."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{API_BASE}/api/admin/checksums",
                params={"source": source_slug},
                headers={"X-API-Key": API_KEY},
                timeout=10,
            )
            r.raise_for_status()
            return set(r.json().get("checksums", []))
    except Exception as e:
        log.warning("checksum_fetch_failed", error=str(e))
        return set()


async def create_scrape_run(source_slug: str) -> str:
    """Create a ScrapeRun DB record and return its ID."""
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{API_BASE}/api/admin/scrape-runs",
            json={"sourceSlug": source_slug, "status": "RUNNING"},
            headers={"X-API-Key": API_KEY},
            timeout=10,
        )
        r.raise_for_status()
        return r.json()["id"]


async def update_scrape_run(run_id: str, payload: dict):
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{API_BASE}/api/admin/scrape-runs/{run_id}",
            json=payload,
            headers={"X-API-Key": API_KEY},
            timeout=10,
        )


async def post_job_draft(payload: dict) -> str | None:
    """POST parsed job to API as DRAFT. Returns job ID."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{API_BASE}/api/admin/jobs",
                json=payload,
                headers={"X-API-Key": API_KEY},
                timeout=20,
            )
            r.raise_for_status()
            return r.json().get("id")
    except Exception as e:
        log.error("job_post_failed", error=str(e))
        return None


async def process_listing(listing: RawListing, run_id: str) -> bool:
    """Parse a single listing via AI and POST to API."""
    pdf_url = listing.pdf_url
    if not pdf_url and listing.detail_url:
        # Try to resolve PDF URL from detail page (simplified)
        pdf_url = listing.detail_url

    if not pdf_url:
        log.warning("no_pdf_url", title=listing.title[:60])
        return False

    try:
        payload = parse_recruitment_pdf(
            pdf_source=pdf_url,
            source_name=listing.source_slug,
            scrape_run_id=run_id,
        )
        payload["sourceChecksum"] = listing.checksum
        job_id = await post_job_draft(payload)
        if job_id:
            log.info("job_created", id=job_id, title=payload.get("title", "")[:60])
            return True
    except ValueError as e:
        log.warning("parse_low_confidence", error=str(e), title=listing.title[:60])
    except Exception as e:
        log.error("process_listing_error", error=str(e), title=listing.title[:60])
    return False


async def run_scraper(source_slug: str):
    """Run one scraper end-to-end."""
    ScraperClass = SCRAPER_REGISTRY.get(source_slug)
    if not ScraperClass:
        log.error("unknown_scraper", slug=source_slug)
        return

    run_id = await create_scrape_run(source_slug)
    known_checksums = await get_known_checksums(source_slug)

    stats = {"jobs_found": 0, "jobs_created": 0, "jobs_skipped": 0, "pdfs_parsed": 0}

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        scraper = ScraperClass(scrape_run_id=run_id)

        try:
            listings = await scraper.run(browser)
            stats["jobs_found"] = len(listings)

            # Process new listings (not already in DB)
            new_listings = [l for l in listings if l.checksum not in known_checksums]
            log.info("new_listings", count=len(new_listings), total=len(listings), source=source_slug)

            # Process concurrently but throttle to avoid hammering AI API
            semaphore = asyncio.Semaphore(3)

            async def process_with_throttle(listing: RawListing):
                async with semaphore:
                    result = await process_listing(listing, run_id)
                    stats["pdfs_parsed"] += 1
                    if result:
                        stats["jobs_created"] += 1
                    else:
                        stats["jobs_skipped"] += 1
                    await asyncio.sleep(1.5)  # rate-limit AI calls

            tasks = [process_with_throttle(l) for l in new_listings]
            await asyncio.gather(*tasks, return_exceptions=True)

            await update_scrape_run(run_id, {
                "status": "SUCCESS",
                "finishedAt": datetime.utcnow().isoformat(),
                **{k: v for k, v in stats.items()},
            })

        except Exception as e:
            log.error("scraper_run_failed", source=source_slug, error=str(e))
            await update_scrape_run(run_id, {
                "status": "FAILED",
                "finishedAt": datetime.utcnow().isoformat(),
                "errorLog": str(e),
            })
        finally:
            await browser.close()


async def run_all_scrapers():
    """Run all active scrapers sequentially (to be gentle on resources)."""
    log.info("orchestrator_start", scrapers=list(SCRAPER_REGISTRY.keys()))
    for slug in SCRAPER_REGISTRY:
        log.info("running_scraper", slug=slug)
        await run_scraper(slug)
        await asyncio.sleep(10)   # cooldown between scrapers
    log.info("orchestrator_done")


# ============================================================
# CLI entry
# ============================================================

if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="SarkariTrack Scraper Agent")
    parser.add_argument("--scraper", help="Run a specific scraper by slug (or 'all')", default="all")
    args = parser.parse_args()

    if args.scraper == "all":
        asyncio.run(run_all_scrapers())
    elif args.scraper in SCRAPER_REGISTRY:
        asyncio.run(run_scraper(args.scraper))
    else:
        print(f"Unknown scraper: {args.scraper}. Available: {list(SCRAPER_REGISTRY.keys())}")
        sys.exit(1)
