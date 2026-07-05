#!/usr/bin/env python3
"""
SarkariTrack — AI Recruitment PDF Parsing Agent
services/agent/parsers/pdf_parser.py

Pipeline:
  1. Download PDF from source URL (or accept local path)
  2. Extract raw text using pdfminer.six (or OCR via pytesseract for scanned PDFs)
  3. Send extracted text to GPT-4o / Claude 3.5 Sonnet with a structured extraction prompt
  4. Validate output against Pydantic schema
  5. Generate SEO metadata (meta title, meta description, JSON-LD)
  6. Return validated JobParseResult dict → caller persists to PostgreSQL via API

Requirements (requirements.txt):
  openai>=1.30.0
  anthropic>=0.28.0
  pdfminer.six>=20221105
  pytesseract>=0.3.10
  pillow>=10.0.0
  pdf2image>=1.16.3
  pydantic>=2.5.0
  httpx>=0.26.0
  python-slugify>=8.0.3
  tenacity>=8.2.3
  structlog>=24.1.0
"""

from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import date, datetime
from enum import Enum
from pathlib import Path
from typing import Any, Optional

import httpx
import structlog
from openai import OpenAI
from pdfminer.high_level import extract_text as pdfminer_extract
from pydantic import BaseModel, Field, field_validator, model_validator
from python_slugify import slugify
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

log = structlog.get_logger()

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

AI_MODEL = os.getenv("AI_MODEL", "gpt-4o")           # or "claude-3-5-sonnet-20241022"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MAX_TEXT_CHARS = 28_000                               # ~7K tokens safety buffer
MIN_CONFIDENCE_THRESHOLD = 0.65


# ──────────────────────────────────────────────
# Pydantic Output Schema (mirrors Prisma Job model)
# ──────────────────────────────────────────────

class PostType(str, Enum):
    ONLINE_FORM = "ONLINE_FORM"
    ADMIT_CARD = "ADMIT_CARD"
    RESULT = "RESULT"
    SYLLABUS = "SYLLABUS"
    ANSWER_KEY = "ANSWER_KEY"
    RECRUITMENT_NOTIFICATION = "RECRUITMENT_NOTIFICATION"


class VacancyBreakdown(BaseModel):
    UR: Optional[int] = None
    OBC: Optional[int] = None
    SC: Optional[int] = None
    ST: Optional[int] = None
    EWS: Optional[int] = None
    PwD: Optional[int] = None
    ExServiceman: Optional[int] = None
    other: Optional[dict[str, int]] = None


class PostWiseVacancy(BaseModel):
    post: str
    vacancies: int
    payScale: Optional[str] = None


class AgeRelaxation(BaseModel):
    OBC: Optional[int] = None
    SC_ST: Optional[int] = None
    PwD: Optional[int] = None
    ExServiceman: Optional[str] = None
    note: Optional[str] = None


class JobParseResult(BaseModel):
    # Identification
    title: str = Field(..., description="Full recruitment title, e.g. 'SSC CGL 2025 Combined Graduate Level'")
    shortTitle: Optional[str] = Field(None, max_length=80, description="Short title for notifications")
    postType: PostType
    department: str = Field(..., description="Issuing organization, e.g. 'Staff Selection Commission'")
    organizationCode: Optional[str] = Field(None, description="Abbreviation, e.g. 'SSC'")
    advertisementNo: Optional[str] = None
    officialWebsite: Optional[str] = None

    # Geography
    stateName: Optional[str] = Field(None, description="State name if state-level, else null for central")
    isNational: bool = Field(True)

    # Vacancies
    totalVacancies: Optional[int] = None
    vacancyBreakdown: Optional[VacancyBreakdown] = None
    postWiseVacancies: Optional[list[PostWiseVacancy]] = None

    # Dates (ISO 8601 YYYY-MM-DD strings)
    notificationDate: Optional[str] = None
    applicationStartDate: Optional[str] = None
    applicationEndDate: Optional[str] = None
    lastFeePaymentDate: Optional[str] = None
    examDate: Optional[str] = None
    admitCardDate: Optional[str] = None
    ageCutoffDate: Optional[str] = None

    # Fees (INR, integers)
    feeGeneral: Optional[int] = None
    feeOBCEWS: Optional[int] = None
    feeSCSTFemale: Optional[int] = None
    feeExServiceman: Optional[int] = None
    feePaymentMode: Optional[str] = None

    # Age
    ageMinYears: Optional[int] = None
    ageMaxYears: Optional[int] = None
    ageRelaxation: Optional[AgeRelaxation] = None

    # Pay
    payScaleMin: Optional[int] = None
    payScaleMax: Optional[int] = None
    payScaleText: Optional[str] = None
    payBand: Optional[str] = None

    # Content
    selectionProcess: Optional[str] = Field(None, description="e.g. 'Tier-I → Tier-II → Document Verification'")
    importantInstructions: Optional[str] = None

    # Qualifications
    qualificationSlugs: list[str] = Field(
        default_factory=list,
        description="List from: ['class-8','class-10','class-12','iti','diploma','graduate','post-graduate','btech','mbbs','llb','ca','phd']"
    )
    qualificationNote: Optional[str] = None

    # Source links found in document
    applyOnlineUrl: Optional[str] = None
    officialPortalUrl: Optional[str] = None
    syllabusUrl: Optional[str] = None

    # Confidence score (0.0 - 1.0) assigned by model
    aiParseConfidence: float = Field(default=0.8, ge=0.0, le=1.0)
    parseWarnings: list[str] = Field(default_factory=list)

    @field_validator("applicationEndDate", "applicationStartDate", "notificationDate",
                     "examDate", "admitCardDate", "lastFeePaymentDate", "ageCutoffDate",
                     mode="before")
    @classmethod
    def validate_date_format(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, (date, datetime)):
            return v.strftime("%Y-%m-%d")
        v_str = str(v).strip()
        # Accept YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY
        patterns = [
            (r"^(\d{4})-(\d{2})-(\d{2})$", "%Y-%m-%d"),
            (r"^(\d{2})-(\d{2})-(\d{4})$", "%d-%m-%Y"),
            (r"^(\d{2})/(\d{2})/(\d{4})$", "%d/%m/%Y"),
        ]
        for pattern, fmt in patterns:
            if re.match(pattern, v_str):
                try:
                    return datetime.strptime(v_str, fmt).strftime("%Y-%m-%d")
                except ValueError:
                    pass
        return None  # Silently drop unparseable dates

    @model_validator(mode="after")
    def derive_slug_and_short_title(self) -> "JobParseResult":
        if not self.shortTitle:
            self.shortTitle = self.title[:80].rstrip()
        return self


# ──────────────────────────────────────────────
# SEO Metadata Generator
# ──────────────────────────────────────────────

def generate_seo_metadata(job: JobParseResult, slug: str) -> dict:
    """Generate meta title, description, and JSON-LD for a parsed job."""
    vacancies_str = f"{job.totalVacancies:,}" if job.totalVacancies else "Multiple"
    end_date_str = job.applicationEndDate or "See notification"

    meta_title = f"{job.title} {datetime.now().year} — Apply Online | SarkariTrack"[:70]
    meta_description = (
        f"{job.title}: {vacancies_str} vacancies. "
        f"Apply online by {end_date_str}. "
        f"Check eligibility, fee, age limit and direct link at SarkariTrack."
    )[:160]

    base_url = os.getenv("SITE_BASE_URL", "https://sarkaritrack.in")
    canonical_url = f"{base_url}/jobs/{slug}"

    json_ld = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": job.title,
        "description": meta_description,
        "hiringOrganization": {
            "@type": "Organization",
            "name": job.department,
            "sameAs": job.officialWebsite or job.officialPortalUrl,
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN",
                "addressRegion": job.stateName or "India",
            },
        },
        "employmentType": "FULL_TIME",
        "datePosted": job.notificationDate,
        "validThrough": job.applicationEndDate,
        "url": canonical_url,
        "identifier": {
            "@type": "PropertyValue",
            "name": job.department,
            "value": job.advertisementNo,
        },
    }
    if job.payScaleMin and job.payScaleMax:
        json_ld["baseSalary"] = {
            "@type": "MonetaryAmount",
            "currency": "INR",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": job.payScaleMin,
                "maxValue": job.payScaleMax,
                "unitText": "MONTH",
            },
        }

    # Internal links map (contextual cross-linking)
    internal_links = [
        {"text": f"{job.department} Previous Year Papers", "url": f"{base_url}/tags/{slugify(job.department)}-previous-papers"},
    ]
    if job.syllabusUrl:
        internal_links.append({"text": f"{job.title} Syllabus", "url": job.syllabusUrl})

    return {
        "slug": slug,
        "metaTitle": meta_title,
        "metaDescription": meta_description,
        "canonicalUrl": canonical_url,
        "structuredDataJson": json_ld,
        "internalLinks": internal_links,
    }


# ──────────────────────────────────────────────
# PDF Text Extractor
# ──────────────────────────────────────────────

def extract_pdf_text(pdf_path: str) -> str:
    """
    Extract raw text from PDF. Falls back to OCR if pdfminer yields < 200 chars.
    """
    try:
        text = pdfminer_extract(pdf_path)
        if text and len(text.strip()) > 200:
            log.info("pdf_text_extracted", method="pdfminer", chars=len(text))
            return text[:MAX_TEXT_CHARS]
    except Exception as e:
        log.warning("pdfminer_failed", error=str(e))

    # OCR fallback for scanned PDFs
    try:
        from pdf2image import convert_from_path
        import pytesseract

        log.info("attempting_ocr_fallback")
        pages = convert_from_path(pdf_path, dpi=200, first_page=1, last_page=6)
        ocr_text = ""
        for page_img in pages:
            ocr_text += pytesseract.image_to_string(page_img, lang="eng+hin") + "\n"
        if len(ocr_text.strip()) > 100:
            log.info("ocr_success", chars=len(ocr_text))
            return ocr_text[:MAX_TEXT_CHARS]
    except Exception as e:
        log.error("ocr_failed", error=str(e))

    raise ValueError("Could not extract readable text from PDF (tried pdfminer + OCR)")


# ──────────────────────────────────────────────
# AI Extraction Prompt
# ──────────────────────────────────────────────

SYSTEM_PROMPT = """You are a precise government recruitment data extraction engine for India.
Your task: extract structured data from official Indian government job notification PDFs.

Rules:
- Be deterministic. Extract only what is explicitly stated in the document.
- For any field you cannot find or are uncertain about, use null.
- Dates MUST be formatted as YYYY-MM-DD strings. Use 1970-01-01 as a placeholder ONLY if a date is mentioned but unreadable.
- All fee and salary values must be plain integers in Indian Rupees (no commas, no symbols).
- For qualificationSlugs, only use values from this exact list:
  ["class-8","class-10","class-12","iti","diploma","graduate","post-graduate","btech","mbbs","llb","ca","phd"]
- Set aiParseConfidence between 0.0 and 1.0 based on how completely you could fill the schema.
  Score 0.9+ only if all critical fields (title, department, vacancies, dates, fees, age) are present.
- Add human-readable warnings to parseWarnings for any field that was ambiguous or estimated.
- Output ONLY valid JSON. No markdown fences. No explanation. Just the JSON object."""

USER_PROMPT_TEMPLATE = """Extract all recruitment data from the following official Indian government notification text.
Return a single JSON object that exactly matches this schema:

{schema_json}

--- NOTIFICATION TEXT START ---
{notification_text}
--- NOTIFICATION TEXT END ---

JSON output:"""


def build_extraction_prompt(text: str) -> list[dict]:
    schema_example = {
        "title": "string",
        "shortTitle": "string|null",
        "postType": "ONLINE_FORM|ADMIT_CARD|RESULT|SYLLABUS|ANSWER_KEY|RECRUITMENT_NOTIFICATION",
        "department": "string",
        "organizationCode": "string|null",
        "advertisementNo": "string|null",
        "officialWebsite": "string|null",
        "stateName": "string|null (null if All India)",
        "isNational": "boolean",
        "totalVacancies": "integer|null",
        "vacancyBreakdown": {"UR": "int|null", "OBC": "int|null", "SC": "int|null", "ST": "int|null", "EWS": "int|null"},
        "postWiseVacancies": [{"post": "string", "vacancies": "int"}],
        "notificationDate": "YYYY-MM-DD|null",
        "applicationStartDate": "YYYY-MM-DD|null",
        "applicationEndDate": "YYYY-MM-DD|null",
        "lastFeePaymentDate": "YYYY-MM-DD|null",
        "examDate": "YYYY-MM-DD|null",
        "ageCutoffDate": "YYYY-MM-DD|null",
        "feeGeneral": "integer_INR|null",
        "feeOBCEWS": "integer_INR|null",
        "feeSCSTFemale": "integer_INR|null",
        "feeExServiceman": "integer_INR|null",
        "feePaymentMode": "string|null",
        "ageMinYears": "integer|null",
        "ageMaxYears": "integer|null",
        "ageRelaxation": {"OBC": "int|null", "SC_ST": "int|null", "PwD": "int|null"},
        "payScaleMin": "integer_INR|null",
        "payScaleMax": "integer_INR|null",
        "payScaleText": "string|null",
        "selectionProcess": "string|null",
        "qualificationSlugs": ["class-10"],
        "applyOnlineUrl": "string|null",
        "officialPortalUrl": "string|null",
        "aiParseConfidence": 0.85,
        "parseWarnings": ["any ambiguity notes"]
    }
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_PROMPT_TEMPLATE.format(
            schema_json=json.dumps(schema_example, indent=2),
            notification_text=text,
        )},
    ]


# ──────────────────────────────────────────────
# AI Call with Retry
# ──────────────────────────────────────────────

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
)
def call_ai_model(messages: list[dict]) -> str:
    """Call OpenAI GPT-4o (or swap to Anthropic Claude)."""
    if AI_MODEL.startswith("claude"):
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        system_msg = next(m["content"] for m in messages if m["role"] == "system")
        user_msgs = [m for m in messages if m["role"] != "system"]
        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=4096,
            system=system_msg,
            messages=user_msgs,
        )
        return response.content[0].text
    else:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=4096,
        )
        return response.choices[0].message.content


# ──────────────────────────────────────────────
# Main Parse Function
# ──────────────────────────────────────────────

def parse_recruitment_pdf(
    pdf_source: str,          # URL or local file path
    source_name: str = "Unknown Source",
    scrape_run_id: Optional[str] = None,
) -> dict:
    """
    Full pipeline: download PDF → extract text → AI parse → validate → generate SEO.

    Returns a dict ready to be POST-ed to the FastAPI /api/admin/jobs endpoint.
    Raises ValueError if confidence < MIN_CONFIDENCE_THRESHOLD.
    """
    log.info("parse_start", source=pdf_source, run_id=scrape_run_id)

    # Step 1: Acquire PDF
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_path = tmp.name
        if pdf_source.startswith("http"):
            with httpx.Client(follow_redirects=True, timeout=30) as client:
                resp = client.get(pdf_source)
                resp.raise_for_status()
                tmp.write(resp.content)
                log.info("pdf_downloaded", bytes=len(resp.content), url=pdf_source)
        else:
            import shutil
            shutil.copy(pdf_source, tmp_path)

    # Step 2: Extract text
    raw_text = extract_pdf_text(tmp_path)
    Path(tmp_path).unlink(missing_ok=True)

    # Step 3: AI Extraction
    messages = build_extraction_prompt(raw_text)
    raw_json_str = call_ai_model(messages)

    # Step 4: Parse & Validate
    try:
        raw_dict = json.loads(raw_json_str)
    except json.JSONDecodeError as e:
        # Attempt to strip markdown fences if model misbehaved
        clean = re.sub(r"```(?:json)?|```", "", raw_json_str).strip()
        raw_dict = json.loads(clean)

    job_result = JobParseResult.model_validate(raw_dict)

    confidence = job_result.aiParseConfidence
    log.info("ai_parse_complete", confidence=confidence, warnings=job_result.parseWarnings)

    if confidence < MIN_CONFIDENCE_THRESHOLD:
        raise ValueError(
            f"AI parse confidence {confidence:.2f} below threshold {MIN_CONFIDENCE_THRESHOLD}. "
            f"Warnings: {job_result.parseWarnings}. Manual review required."
        )

    # Step 5: Generate slug
    year = datetime.now().year
    slug_base = f"{job_result.title} {year}"
    slug = slugify(slug_base)[:120]

    # Step 6: SEO generation
    seo = generate_seo_metadata(job_result, slug)

    # Step 7: Compose final payload
    payload = {
        **job_result.model_dump(exclude={"parseWarnings", "aiParseConfidence"}),
        **seo,
        "slug": slug,
        "status": "DRAFT",                     # Always DRAFT — human reviews before going LIVE
        "sourceUrl": pdf_source if pdf_source.startswith("http") else None,
        "scrapedFromRunId": scrape_run_id,
        "isManualEntry": False,
        "aiParseConfidence": confidence,
        "parseWarnings": job_result.parseWarnings,
    }

    log.info("parse_success", slug=slug, title=job_result.title, confidence=confidence)
    return payload


# ──────────────────────────────────────────────
# Notification Publisher
# ──────────────────────────────────────────────

class NotificationPayload(BaseModel):
    jobId: str
    title: str
    department: str
    totalVacancies: Optional[int]
    applicationEndDate: Optional[str]
    slug: str
    applyOnlineUrl: Optional[str]


def format_whatsapp_message(n: NotificationPayload) -> str:
    base_url = os.getenv("SITE_BASE_URL", "https://sarkaritrack.in")
    vacancies = f"{n.totalVacancies:,}" if n.totalVacancies else "Announced"
    return (
        f"🔔 *New Sarkari Job Alert!*\n\n"
        f"📋 *{n.title}*\n"
        f"🏛️ {n.department}\n"
        f"👥 Vacancies: *{vacancies}*\n"
        f"📅 Last Date: *{n.applicationEndDate or 'See notification'}*\n\n"
        f"👉 Full Details & Apply: {base_url}/jobs/{n.slug}\n\n"
        f"_SarkariTrack — Your #1 Sarkari Job Portal_"
    )


def format_telegram_message(n: NotificationPayload) -> str:
    base_url = os.getenv("SITE_BASE_URL", "https://sarkaritrack.in")
    vacancies = f"{n.totalVacancies:,}" if n.totalVacancies else "Multiple"
    return (
        f"🔔 <b>New Job Alert: {n.title}</b>\n\n"
        f"🏛 Department: {n.department}\n"
        f"👥 Vacancies: <b>{vacancies}</b>\n"
        f"📅 Last Date: <b>{n.applicationEndDate or 'See notification'}</b>\n\n"
        f"🔗 <a href=\"{base_url}/jobs/{n.slug}\">View Details & Apply Online</a>"
    )


def publish_to_telegram(n: NotificationPayload) -> bool:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    channel_id = os.getenv("TELEGRAM_CHANNEL_ID")
    if not token or not channel_id:
        log.warning("telegram_not_configured")
        return False
    text = format_telegram_message(n)
    resp = httpx.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": channel_id, "text": text, "parse_mode": "HTML"},
        timeout=15,
    )
    success = resp.status_code == 200
    log.info("telegram_sent", success=success, status=resp.status_code)
    return success


def publish_to_whatsapp(n: NotificationPayload) -> bool:
    token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    channel_number = os.getenv("WHATSAPP_CHANNEL_NUMBER")
    if not all([token, phone_id, channel_number]):
        log.warning("whatsapp_not_configured")
        return False
    text = format_whatsapp_message(n)
    payload = {
        "messaging_product": "whatsapp",
        "to": channel_number,
        "type": "text",
        "text": {"body": text},
    }
    resp = httpx.post(
        f"https://graph.facebook.com/v19.0/{phone_id}/messages",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=15,
    )
    success = resp.status_code == 200
    log.info("whatsapp_sent", success=success, status=resp.status_code)
    return success


def dispatch_all_notifications(n: NotificationPayload) -> dict[str, bool]:
    """Publish to all channels. Called by webhook when job status → LIVE."""
    results = {
        "telegram": publish_to_telegram(n),
        "whatsapp": publish_to_whatsapp(n),
        # web_push is handled server-side in the Next.js API route /api/subscribe
    }
    log.info("notifications_dispatched", results=results, job_id=n.jobId)
    return results


# ──────────────────────────────────────────────
# Dead-Link Sentinel (hourly microservice)
# ──────────────────────────────────────────────

LINK_CHECK_TIMEOUT = 10  # seconds


def check_external_link(url: str) -> tuple[str, int | None]:
    """
    Returns (status: "OK"|"DOWN"|"REDIRECT", http_code).
    """
    if not url or not url.startswith("http"):
        return ("UNKNOWN", None)
    try:
        resp = httpx.head(url, follow_redirects=True, timeout=LINK_CHECK_TIMEOUT)
        if resp.status_code == 200:
            return ("OK", 200)
        elif resp.status_code in (301, 302, 307, 308):
            return ("REDIRECT", resp.status_code)
        elif resp.status_code == 404:
            return ("DOWN", 404)
        else:
            return ("DOWN", resp.status_code)
    except httpx.TimeoutException:
        return ("DOWN", None)
    except Exception as e:
        log.warning("link_check_error", url=url, error=str(e))
        return ("DOWN", None)


# ──────────────────────────────────────────────
# CLI Entry Point
# ──────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import pprint

    if len(sys.argv) < 2:
        print("Usage: python pdf_parser.py <pdf_url_or_path>")
        sys.exit(1)

    pdf_input = sys.argv[1]
    print(f"\n⚙️  Parsing: {pdf_input}\n")

    try:
        result = parse_recruitment_pdf(pdf_input, source_name="CLI Test")
        print("\n✅ Parse Result:")
        pprint.pprint(result, width=100)

        # Print validation summary
        conf = result.get("aiParseConfidence", 0)
        warnings = result.get("parseWarnings", [])
        print(f"\n📊 Confidence: {conf:.0%}")
        if warnings:
            print(f"⚠️  Warnings ({len(warnings)}):")
            for w in warnings:
                print(f"   • {w}")
        print(f"\n🔗 Generated slug: {result.get('slug')}")
        print(f"📝 Meta description: {result.get('metaDescription')}")

    except ValueError as e:
        print(f"\n❌ Parse failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        raise
