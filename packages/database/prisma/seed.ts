// ============================================================
// packages/database/prisma/seed.ts
// Full seed: all 36 states/UTs + qualifications + scraper sources
// Run: npx ts-node prisma/seed.ts
// ============================================================

import { PrismaClient, QualificationLevel } from "@prisma/client";

const prisma = new PrismaClient();

const STATES = [
  // 28 States
  { name: "Andhra Pradesh",        slug: "andhra-pradesh",       code: "AP", isUnionTerr: false },
  { name: "Arunachal Pradesh",      slug: "arunachal-pradesh",    code: "AR", isUnionTerr: false },
  { name: "Assam",                  slug: "assam",                code: "AS", isUnionTerr: false },
  { name: "Bihar",                  slug: "bihar",                code: "BR", isUnionTerr: false },
  { name: "Chhattisgarh",           slug: "chhattisgarh",         code: "CG", isUnionTerr: false },
  { name: "Goa",                    slug: "goa",                  code: "GA", isUnionTerr: false },
  { name: "Gujarat",                slug: "gujarat",              code: "GJ", isUnionTerr: false },
  { name: "Haryana",                slug: "haryana",              code: "HR", isUnionTerr: false },
  { name: "Himachal Pradesh",       slug: "himachal-pradesh",     code: "HP", isUnionTerr: false },
  { name: "Jharkhand",              slug: "jharkhand",            code: "JH", isUnionTerr: false },
  { name: "Karnataka",              slug: "karnataka",            code: "KA", isUnionTerr: false },
  { name: "Kerala",                 slug: "kerala",               code: "KL", isUnionTerr: false },
  { name: "Madhya Pradesh",         slug: "madhya-pradesh",       code: "MP", isUnionTerr: false },
  { name: "Maharashtra",            slug: "maharashtra",          code: "MH", isUnionTerr: false },
  { name: "Manipur",                slug: "manipur",              code: "MN", isUnionTerr: false },
  { name: "Meghalaya",              slug: "meghalaya",            code: "ML", isUnionTerr: false },
  { name: "Mizoram",                slug: "mizoram",              code: "MZ", isUnionTerr: false },
  { name: "Nagaland",               slug: "nagaland",             code: "NL", isUnionTerr: false },
  { name: "Odisha",                 slug: "odisha",               code: "OD", isUnionTerr: false },
  { name: "Punjab",                 slug: "punjab",               code: "PB", isUnionTerr: false },
  { name: "Rajasthan",              slug: "rajasthan",            code: "RJ", isUnionTerr: false },
  { name: "Sikkim",                 slug: "sikkim",               code: "SK", isUnionTerr: false },
  { name: "Tamil Nadu",             slug: "tamil-nadu",           code: "TN", isUnionTerr: false },
  { name: "Telangana",              slug: "telangana",            code: "TS", isUnionTerr: false },
  { name: "Tripura",                slug: "tripura",              code: "TR", isUnionTerr: false },
  { name: "Uttar Pradesh",          slug: "uttar-pradesh",        code: "UP", isUnionTerr: false },
  { name: "Uttarakhand",            slug: "uttarakhand",          code: "UK", isUnionTerr: false },
  { name: "West Bengal",            slug: "west-bengal",          code: "WB", isUnionTerr: false },
  // 8 Union Territories
  { name: "Andaman & Nicobar Islands", slug: "andaman-nicobar",  code: "AN", isUnionTerr: true },
  { name: "Chandigarh",             slug: "chandigarh",           code: "CH", isUnionTerr: true },
  { name: "Dadra & Nagar Haveli and Daman & Diu", slug: "dadra-nagar-haveli-daman-diu", code: "DD", isUnionTerr: true },
  { name: "Delhi",                  slug: "delhi",                code: "DL", isUnionTerr: true },
  { name: "Jammu & Kashmir",        slug: "jammu-kashmir",        code: "JK", isUnionTerr: true },
  { name: "Ladakh",                 slug: "ladakh",               code: "LA", isUnionTerr: true },
  { name: "Lakshadweep",            slug: "lakshadweep",          code: "LD", isUnionTerr: true },
  { name: "Puducherry",             slug: "puducherry",           code: "PY", isUnionTerr: true },
];

const QUALIFICATIONS = [
  { level: "CLASS_8"        as QualificationLevel, label: "8th Pass",                          slug: "class-8"        },
  { level: "CLASS_10"       as QualificationLevel, label: "10th Pass / Matriculation",         slug: "10th-pass"      },
  { level: "CLASS_12"       as QualificationLevel, label: "12th Pass / Intermediate",          slug: "12th-pass"      },
  { level: "ITI"            as QualificationLevel, label: "ITI Certificate",                   slug: "iti"            },
  { level: "DIPLOMA"        as QualificationLevel, label: "Diploma (Polytechnic)",             slug: "diploma"        },
  { level: "GRADUATE"       as QualificationLevel, label: "Graduate (Any Stream)",             slug: "graduate"       },
  { level: "BTECH"          as QualificationLevel, label: "B.Tech / B.E. (Engineering)",       slug: "btech"          },
  { level: "POST_GRADUATE"  as QualificationLevel, label: "Post Graduate / Master's Degree",   slug: "post-graduate"  },
  { level: "MBBS"           as QualificationLevel, label: "MBBS / Medical Graduate",           slug: "mbbs"           },
  { level: "LLB"            as QualificationLevel, label: "LLB / Law Graduate",                slug: "llb"            },
  { level: "CA"             as QualificationLevel, label: "CA / CMA / CS",                     slug: "ca"             },
  { level: "PHD"            as QualificationLevel, label: "PhD / Doctorate",                   slug: "phd"            },
];

const SCRAPER_SOURCES = [
  {
    name: "UPSC Official",
    slug: "upsc",
    baseUrl: "https://upsc.gov.in",
    scraperClass: "UPSCScraper",
    isActive: true,
    cronSchedule: "0 1 * * *",
  },
  {
    name: "SSC Official",
    slug: "ssc",
    baseUrl: "https://ssc.gov.in",
    scraperClass: "SSCScraper",
    isActive: true,
    cronSchedule: "30 1 * * *",
  },
  {
    name: "IBPS Official",
    slug: "ibps",
    baseUrl: "https://www.ibps.in",
    scraperClass: "IBPSScraper",
    isActive: true,
    cronSchedule: "0 2 * * *",
  },
  {
    name: "Employment News",
    slug: "employment_news",
    baseUrl: "https://www.employmentnews.gov.in",
    scraperClass: "EmploymentNewsScraper",
    isActive: true,
    cronSchedule: "30 2 * * *",
  },
  {
    name: "UPPSC Official",
    slug: "uppsc",
    baseUrl: "https://uppsc.up.nic.in",
    scraperClass: "UPPSCScraper",
    isActive: true,
    cronSchedule: "0 3 * * *",
  },
  {
    name: "BPSC Official",
    slug: "bpsc",
    baseUrl: "https://www.bpsc.bih.nic.in",
    scraperClass: "BPSCScraper",
    isActive: true,
    cronSchedule: "30 3 * * *",
  },
  {
    name: "Railway Recruitment Boards",
    slug: "rrb",
    baseUrl: "https://www.rrbapply.gov.in",
    scraperClass: "RRBScraper",
    isActive: true,
    cronSchedule: "0 4 * * *",
  },
];

const SYSTEM_SETTINGS = [
  { key: "breaking_news",        value: "" },
  { key: "site_announcement",    value: "" },
  { key: "maintenance_mode",     value: "false" },
  { key: "adsense_enabled",      value: "true" },
  { key: "push_notifications_enabled", value: "true" },
];

async function main() {
  console.log("🌱 Starting database seed...\n");

  // States
  console.log("📍 Seeding states & UTs...");
  for (const state of STATES) {
    await prisma.state.upsert({
      where: { slug: state.slug },
      update: { name: state.name, code: state.code, isUnionTerr: state.isUnionTerr },
      create: state,
    });
  }
  console.log(`   ✓ ${STATES.length} states/UTs seeded`);

  // Qualifications
  console.log("🎓 Seeding qualifications...");
  for (const qual of QUALIFICATIONS) {
    await prisma.qualification.upsert({
      where: { slug: qual.slug },
      update: { label: qual.label, level: qual.level },
      create: qual,
    });
  }
  console.log(`   ✓ ${QUALIFICATIONS.length} qualification levels seeded`);

  // Scraper sources
  console.log("🤖 Seeding scraper sources...");
  for (const source of SCRAPER_SOURCES) {
    await prisma.scraperSource.upsert({
      where: { slug: source.slug },
      update: { isActive: source.isActive, cronSchedule: source.cronSchedule },
      create: source,
    });
  }
  console.log(`   ✓ ${SCRAPER_SOURCES.length} scraper sources seeded`);

  // System settings
  console.log("⚙️  Seeding system settings...");
  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`   ✓ ${SYSTEM_SETTINGS.length} system settings seeded`);

  console.log("\n✅ Database seed complete!");
  console.log("   Next steps:");
  console.log("   1. cd apps/web && pnpm dev");
  console.log("   2. cd services/api && uvicorn main:app --reload");
  console.log("   3. python services/agent/pdf_parser.py <test-pdf-url>");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


// ============================================================
// apps/web/src/lib/utils.ts
// Shared utility functions
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns number of days until an ISO date string.
 * Returns null for invalid dates.
 * Returns negative values for past dates.
 */
export function daysUntil(isoDate: string): number | null {
  const end = new Date(isoDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format number in Indian numbering system.
 * 1234567 → "12,34,567"
 */
export function formatIndianNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

/**
 * Generate a URL-safe slug from a string.
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Truncate text to a max character length with ellipsis.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

/**
 * Format a Date or ISO string for display.
 * e.g. "15 Jun 2025"
 */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Relative time label for "how long ago".
 */
export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Calculate exact age (years, months, days) between two dates.
 */
export function calcExactAge(
  dob: Date,
  reference: Date
): { years: number; months: number; days: number } {
  let years  = reference.getFullYear() - dob.getFullYear();
  let months = reference.getMonth()    - dob.getMonth();
  let days   = reference.getDate()     - dob.getDate();
  if (days   < 0) { months--; days   += new Date(reference.getFullYear(), reference.getMonth(), 0).getDate(); }
  if (months < 0) { years--;  months += 12; }
  return { years, months, days };
}

/**
 * Determine job status color class for Tailwind.
 */
export function jobStatusColor(status: string): string {
  const map: Record<string, string> = {
    LIVE:         "text-emerald-600",
    CLOSING_SOON: "text-orange-600",
    CLOSED:       "text-gray-400",
    RESULT_OUT:   "text-blue-600",
    ARCHIVED:     "text-gray-300",
    DRAFT:        "text-yellow-500",
  };
  return map[status] ?? "text-gray-500";
}


// ============================================================
// apps/web/src/app/sitemap.ts
// Dynamic sitemap generation for Google
// ============================================================

import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaritrack.in";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                                    priority: 1.0,  changeFrequency: "hourly"  },
    { url: `${BASE}/results`,                       priority: 0.9,  changeFrequency: "hourly"  },
    { url: `${BASE}/admit-cards`,                   priority: 0.9,  changeFrequency: "hourly"  },
    { url: `${BASE}/tools`,                         priority: 0.8,  changeFrequency: "monthly" },
    { url: `${BASE}/tools/photo-signature-resizer`, priority: 0.8,  changeFrequency: "monthly" },
    { url: `${BASE}/tools/sarkari-age-calculator`,  priority: 0.8,  changeFrequency: "monthly" },
    { url: `${BASE}/tools/smart-eligibility-engine`,priority: 0.8,  changeFrequency: "monthly" },
    { url: `${BASE}/about`,                         priority: 0.4,  changeFrequency: "yearly"  },
    { url: `${BASE}/privacy`,                       priority: 0.3,  changeFrequency: "yearly"  },
    { url: `${BASE}/disclaimer`,                    priority: 0.3,  changeFrequency: "yearly"  },
  ];

  // Job pages
  const jobs = await prisma.job.findMany({
    where: { status: { not: "DRAFT" } },
    select: { slug: true, updatedAt: true, status: true },
    orderBy: { updatedAt: "desc" },
    take: 10_000,
  });

  const jobPages: MetadataRoute.Sitemap = jobs.map((j) => ({
    url: `${BASE}/jobs/${j.slug}`,
    lastModified: j.updatedAt,
    priority: j.status === "LIVE" || j.status === "CLOSING_SOON" ? 0.9 : 0.5,
    changeFrequency: j.status === "LIVE" ? ("daily" as const) : ("weekly" as const),
  }));

  // State hub pages
  const states = await prisma.state.findMany({ select: { slug: true } });
  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${BASE}/state/${s.slug}`,
    priority: 0.8,
    changeFrequency: "daily" as const,
  }));

  // Qualification hub pages
  const quals = await prisma.qualification.findMany({ select: { slug: true } });
  const qualPages: MetadataRoute.Sitemap = quals.map((q) => ({
    url: `${BASE}/qualification/${q.slug}`,
    priority: 0.7,
    changeFrequency: "daily" as const,
  }));

  return [...staticPages, ...jobPages, ...statePages, ...qualPages];
}


// ============================================================
// apps/web/src/app/robots.ts
// ============================================================

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaritrack.in";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_next/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 0,
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}


// ============================================================
// apps/web/src/lib/web-push.ts
// Server-side web push notification dispatcher
// ============================================================

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT ?? "admin@sarkaritrack.in"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
}

/**
 * Send a push notification to all subscribed browsers.
 * Called when a job goes LIVE.
 */
export async function broadcastPushNotification(payload: PushPayload): Promise<{
  sent: number;
  failed: number;
}> {
  const subscriptions = await prisma.pushSubscription.findMany({
    take: 5000, // Process in batches for large subscriber bases
  });

  const notification = JSON.stringify({
    title:  payload.title,
    body:   payload.body,
    icon:   payload.icon  ?? "/icons/icon-192.png",
    badge:  payload.badge ?? "/icons/badge-72.png",
    data:   { url: payload.url },
    actions: [
      { action: "view",  title: "View Details" },
      { action: "close", title: "Dismiss" },
    ],
  });

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
          },
          notification,
          { TTL: 86400 } // 24hr TTL
        );
        sent++;
      } catch (err: any) {
        failed++;
        // 410 Gone = subscription expired/unsubscribed
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }

  return { sent, failed };
}

/**
 * Register service worker push subscription (called from /api/subscribe).
 */
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
}


// ============================================================
// apps/web/public/sw.js
// Service Worker — handles push notifications & offline cache
// ============================================================
/*
const CACHE_NAME = "sarkaritrack-v1";
const STATIC_ASSETS = ["/", "/tools/sarkari-age-calculator", "/offline.html"];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match("/offline.html")))
  );
});

// Push notification received
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon    || "/icons/icon-192.png",
      badge:   data.badge   || "/icons/badge-72.png",
      data:    data.data,
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  if (event.action === "close") return;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
*/


// ============================================================
// apps/web/tailwind.config.ts
// ============================================================

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A8A",
        },
      },
      keyframes: {
        marquee: {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee:  "marquee 30s linear infinite",
        "fade-in": "fade-in 0.2s ease-out",
      },
      boxShadow: {
        "inner-sm": "inset 0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
};

export default config;


// ============================================================
// apps/web/src/app/api/revalidate/route.ts
// On-demand ISR revalidation (called by FastAPI on publish)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (secret !== process.env.NEXTJS_REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { slug, type = "job" } = body;

  if (type === "job" && slug) {
    revalidatePath(`/jobs/${slug}`);
    revalidatePath("/");             // homepage matrix
    revalidatePath("/results");
    revalidatePath("/admit-cards");
  } else if (type === "all") {
    revalidatePath("/", "layout");   // full site revalidation
  }

  return NextResponse.json({ revalidated: true, slug });
}


// ============================================================
// apps/web/src/hooks/useJobFilters.ts
// Shared hook for URL-synced job filter state
// ============================================================

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface JobFilters {
  q: string;
  state: string;
  qualification: string;
  department: string;
  salary: string;
  type: string;
}

const DEFAULTS: JobFilters = {
  q: "", state: "", qualification: "", department: "", salary: "", type: "",
};

export function useJobFilters() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const filters: JobFilters = useMemo(() => ({
    q:             searchParams.get("q")             ?? "",
    state:         searchParams.get("state")         ?? "",
    qualification: searchParams.get("qualification") ?? "",
    department:    searchParams.get("department")    ?? "",
    salary:        searchParams.get("salary")        ?? "",
    type:          searchParams.get("type")          ?? "",
  }), [searchParams]);

  const setFilter = useCallback((key: keyof JobFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset pagination on filter change
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters = Object.entries(filters).some(
    ([, v]) => v !== ""
  );

  return { filters, setFilter, clearAll, hasActiveFilters };
}


// ============================================================
// apps/web/src/types/job.ts
// Shared TypeScript types
// ============================================================

export type JobStatus =
  | "DRAFT"
  | "LIVE"
  | "CLOSING_SOON"
  | "CLOSED"
  | "ARCHIVED"
  | "RESULT_OUT";

export type PostType =
  | "ONLINE_FORM"
  | "ADMIT_CARD"
  | "RESULT"
  | "SYLLABUS"
  | "ANSWER_KEY"
  | "RECRUITMENT_NOTIFICATION";

export interface VacancyBreakdown {
  UR?: number;
  OBC?: number;
  SC?: number;
  ST?: number;
  EWS?: number;
  PwD?: number;
  ExServiceman?: number;
  [key: string]: number | undefined;
}

export interface PostWiseVacancy {
  post: string;
  vacancies: number;
  payScale?: string;
}

export interface AgeRelaxation {
  OBC?: number;
  SC_ST?: number;
  PwD?: number;
  ExServiceman?: string;
  note?: string;
}

export interface JobSummary {
  id: string;
  slug: string;
  title: string;
  shortTitle: string | null;
  department: string;
  stateName: string | null;
  stateSlug: string | null;
  isNational: boolean;
  postType: PostType;
  status: JobStatus;
  totalVacancies: number | null;
  payScaleText: string | null;
  payScaleMin: number | null;
  payScaleMax: number | null;
  applicationEndDate: string | null;
  notificationDate: string | null;
  qualificationLabels: string[];
  applyOnlineUrl: string | null;
  notificationPdfUrl: string | null;
}

export interface JobDetail extends JobSummary {
  advertisementNo: string | null;
  officialWebsite: string | null;
  vacancyBreakdown: VacancyBreakdown | null;
  postWiseVacancies: PostWiseVacancy[] | null;
  applicationStartDate: string | null;
  lastFeePaymentDate: string | null;
  examDate: string | null;
  admitCardDate: string | null;
  resultDate: string | null;
  ageCutoffDate: string | null;
  feeGeneral: number | null;
  feeOBCEWS: number | null;
  feeSCSTFemale: number | null;
  feeExServiceman: number | null;
  feePaymentMode: string | null;
  ageMinYears: number | null;
  ageMaxYears: number | null;
  ageRelaxation: AgeRelaxation | null;
  payBand: string | null;
  selectionProcess: string | null;
  importantInstructions: string | null;
  summaryHtml: string | null;
  syllabusUrl: string | null;
  officialPortalUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  structuredDataJson: Record<string, unknown> | null;
}
