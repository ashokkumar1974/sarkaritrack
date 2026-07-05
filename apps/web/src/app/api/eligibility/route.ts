// ============================================================
// apps/web/src/app/api/search/route.ts — FIXED
// Removed "edge" runtime (causes Prisma to break on Vercel)
// Added proper error handling + input sanitization
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

// ❌ REMOVE THIS LINE — breaks Prisma on Vercel edge:
// export const runtime = "edge";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "6"), 1), 10);

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Sanitize: remove special regex characters
  const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  try {
    const jobs = await withRetry(() =>
      prisma.job.findMany({
        where: {
          status: { in: ["LIVE", "CLOSING_SOON", "RESULT_OUT"] },
          OR: [
            { title:      { contains: safeQ, mode: "insensitive" } },
            { department: { contains: safeQ, mode: "insensitive" } },
            { shortTitle: { contains: safeQ, mode: "insensitive" } },
          ],
        },
        select: {
          slug:       true,
          title:      true,
          department: true,
          postType:   true,
          status:     true,
        },
        take: limit,
        orderBy: [
          { status: "asc" },
          { publishedAt: "desc" },
        ],
      })
    );

    return NextResponse.json(
      { results: jobs },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (err) {
    console.error("[Search API]", err);
    return NextResponse.json(
      { results: [], error: "Search temporarily unavailable" },
      { status: 500 }
    );
  }
}


// ============================================================
// apps/web/src/app/api/eligibility/route.ts — FIXED
// Removed edge runtime, fixed age calculation logic
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dob          = searchParams.get("dob") ?? "";
  const category     = searchParams.get("category") ?? "General";
  const state        = searchParams.get("state") ?? "All India";
  const qualSlugsRaw = searchParams.get("qualifications") ?? "";
  const qualSlugs    = qualSlugsRaw.split(",").filter(Boolean);

  // Validate DOB
  const dobDate = new Date(dob);
  if (!dob || isNaN(dobDate.getTime())) {
    return NextResponse.json({ jobs: [], error: "Invalid date of birth" }, { status: 400 });
  }
  if (qualSlugs.length === 0) {
    return NextResponse.json({ jobs: [], error: "Select at least one qualification" }, { status: 400 });
  }

  const ageYears = Math.floor(
    (Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  const relaxationMap: Record<string, number> = {
    General: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwD: 10,
  };
  const relaxation = relaxationMap[category] ?? 0;

  try {
    const jobs = await withRetry(() =>
      prisma.job.findMany({
        where: {
          status: { in: ["LIVE", "CLOSING_SOON"] },
          qualifications: {
            some: {
              qualification: { slug: { in: qualSlugs } },
            },
          },
          // Age filter: user must be >= minAge and <= maxAge + relaxation
          AND: [
            {
              OR: [
                { ageMinYears: null },
                { ageMinYears: { lte: ageYears } },
              ],
            },
            {
              OR: [
                { ageMaxYears: null },
                // effective max = maxAge + relaxation
                { ageMaxYears: { gte: ageYears - relaxation } },
              ],
            },
          ],
          // State filter
          ...(state !== "All India"
            ? {
                OR: [
                  { isNational: true },
                  { state: { name: { contains: state, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        select: {
          id:                 true,
          slug:               true,
          title:              true,
          department:         true,
          totalVacancies:     true,
          applicationEndDate: true,
          payScaleText:       true,
          status:             true,
        },
        orderBy: [
          { status: "asc" },
          { applicationEndDate: "asc" },
        ],
        take: 50,
      })
    );

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        ...j,
        applicationEndDate: j.applicationEndDate?.toISOString() ?? null,
      })),
      meta: { ageYears, relaxation, effectiveMaxAge: null },
    });
  } catch (err) {
    console.error("[Eligibility API]", err);
    return NextResponse.json({ jobs: [], error: "Server error" }, { status: 500 });
  }
}


// ============================================================
// apps/web/src/app/api/subscribe/route.ts — FIXED
// Added VAPID check, better error messages
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  // Return VAPID public key for client-side subscription setup
  if (!env.VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      { error: "Push notifications not configured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ vapidPublicKey: env.VAPID_PUBLIC_KEY });
}

export async function POST(req: NextRequest) {
  if (!env.VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      { error: "Push notifications not configured on server" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { endpoint, keys } = body ?? {};

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json({ error: "Invalid subscription: missing endpoint" }, { status: 400 });
    }
    if (!keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription: missing keys" }, { status: 400 });
    }
    if (!endpoint.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid endpoint URL" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where:  { endpoint },
      update: { p256dhKey: keys.p256dh, authKey: keys.auth },
      create: {
        endpoint,
        p256dhKey: keys.p256dh,
        authKey:   keys.auth,
        userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Subscribe API]", err);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}


// ============================================================
// apps/web/src/app/api/revalidate/route.ts — FIXED
// Secured revalidation endpoint
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Verify secret
    const authHeader = req.headers.get("x-revalidate-secret");
    const bodySecret = (await req.json().catch(() => ({}))).secret;
    const secret = authHeader ?? bodySecret;

    if (!env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Revalidation not configured" }, { status: 503 });
    }
    if (secret !== env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { slug, type = "job" } = body;

    if (type === "job" && slug) {
      revalidatePath(`/jobs/${slug}`);
      revalidatePath("/");
      revalidatePath("/results");
      revalidatePath("/admit-cards");
    } else if (type === "homepage") {
      revalidatePath("/");
    } else if (type === "all") {
      revalidatePath("/", "layout");
    } else {
      return NextResponse.json({ error: "Unknown revalidation type" }, { status: 400 });
    }

    return NextResponse.json({ revalidated: true, slug, type });
  } catch (err) {
    console.error("[Revalidate API]", err);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}


// ============================================================
// apps/web/src/middleware.ts — FIXED CORS + Security
// Handles CORS between Vercel frontend and Railway API
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaritrack.in",
  "https://www.sarkaritrack.in",
  "https://admin.sarkaritrack.in",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin") ?? "";

  // ── Handle CORS preflight for API routes ───────────────
  if (pathname.startsWith("/api/")) {
    // Preflight
    if (req.method === "OPTIONS") {
      const isAllowed = ALLOWED_ORIGINS.includes(origin) || !origin;
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  isAllowed ? origin : ALLOWED_ORIGINS[0],
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, X-Revalidate-Secret",
          "Access-Control-Max-Age":       "86400",
        },
      });
    }

    // Add CORS headers to actual API responses
    const res = NextResponse.next();
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || !origin;
    if (isAllowed) {
      res.headers.set("Access-Control-Allow-Origin", origin || "*");
      res.headers.set("Access-Control-Allow-Credentials", "true");
    }

    // Block direct admin API access without key
    if (pathname.startsWith("/api/admin/") || pathname.startsWith("/api/v1/admin/")) {
      const apiKey = req.headers.get("x-api-key");
      const internalKey = process.env.INTERNAL_API_KEY;
      if (internalKey && apiKey !== internalKey) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
