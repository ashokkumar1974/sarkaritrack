// ============================================================
// apps/web/src/app/layout.tsx — Root Layout
// ============================================================
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaritrack.in"),
  title: { default: "SarkariTrack", template: "%s | SarkariTrack" },
  description: "India's fastest government job portal. Instant alerts for SSC, UPSC, Railway, Bank, State PSC.",
  manifest: "/manifest.json",
  themeColor: "#0F172A",
  viewport: { width: "device-width", initialScale: 1 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#F7F8FC] text-gray-900 antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}


// ============================================================
// apps/web/src/components/layout/Header.tsx
// ============================================================
"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap, Bell } from "lucide-react";

const NAV = [
  { label: "Latest Jobs",   href: "/" },
  { label: "Results",       href: "/results" },
  { label: "Admit Cards",   href: "/admit-cards" },
  { label: "Syllabus",      href: "/syllabus" },
  { label: "Free Tools",    href: "/tools" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-[#0F172A] text-white sticky top-0 z-40 border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Sarkari<span className="text-blue-400">Track</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/tools/smart-eligibility-engine"
            className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Bell size={12} /> Get Alerts
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#1E293B] border-t border-white/10 px-4 py-3 space-y-1">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-slate-300 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-lg font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/tools/smart-eligibility-engine"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-3 py-2.5 rounded-lg mt-2"
          >
            <Bell size={14} /> Get Job Alerts
          </Link>
        </div>
      )}
    </header>
  );
}


// ============================================================
// apps/web/src/components/layout/Footer.tsx
// ============================================================
import Link from "next/link";
import { Zap } from "lucide-react";

const FOOTER_LINKS = {
  "Browse Jobs": [
    { label: "All India Jobs",    href: "/" },
    { label: "Railway Jobs",      href: "/jobs?dept=railway" },
    { label: "Bank Jobs",         href: "/jobs?dept=bank" },
    { label: "Defence Jobs",      href: "/jobs?dept=defence" },
    { label: "Teaching Jobs",     href: "/jobs?dept=teaching" },
    { label: "Police Jobs",       href: "/jobs?dept=police" },
  ],
  "By Qualification": [
    { label: "10th Pass",   href: "/qualification/10th-pass" },
    { label: "12th Pass",   href: "/qualification/12th-pass" },
    { label: "Graduate",    href: "/qualification/graduate" },
    { label: "B.Tech",      href: "/qualification/btech" },
    { label: "ITI",         href: "/qualification/iti" },
    { label: "Diploma",     href: "/qualification/diploma" },
  ],
  "Free Tools": [
    { label: "Photo Resizer",          href: "/tools/photo-signature-resizer" },
    { label: "Age Calculator",         href: "/tools/sarkari-age-calculator" },
    { label: "Eligibility Engine",     href: "/tools/smart-eligibility-engine" },
  ],
  "Company": [
    { label: "About Us",        href: "/about" },
    { label: "Privacy Policy",  href: "/privacy" },
    { label: "Terms of Use",    href: "/terms" },
    { label: "Contact",         href: "/contact" },
    { label: "Disclaimer",      href: "/disclaimer" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-slate-400 mt-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white font-bold text-sm mb-3">{section}</h3>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular states strip */}
        <div className="border-t border-white/10 pt-6 mb-6">
          <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wide">Popular State Jobs</p>
          <div className="flex flex-wrap gap-2">
            {["Uttar Pradesh", "Bihar", "Rajasthan", "Madhya Pradesh", "Maharashtra",
              "Gujarat", "West Bengal", "Karnataka", "Haryana", "Delhi", "Jharkhand"].map((s) => (
              <Link
                key={s}
                href={`/state/${s.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {s} Jobs ·
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">SarkariTrack</span>
          </div>
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} SarkariTrack. All Rights Reserved. · For informational purposes only.
            Always verify from official government portals.
          </p>
        </div>
      </div>
    </footer>
  );
}


// ============================================================
// apps/web/src/app/api/search/route.ts — Search API Route
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "6"), 10);

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: { in: ["LIVE", "CLOSING_SOON", "RESULT_OUT"] },
        OR: [
          { title:      { contains: q, mode: "insensitive" } },
          { department: { contains: q, mode: "insensitive" } },
          { shortTitle: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { slug: true, title: true, department: true, postType: true, status: true },
      take: limit,
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ results: jobs });
  } catch (err) {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}


// ============================================================
// apps/web/src/app/api/eligibility/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dob          = searchParams.get("dob");
  const category     = searchParams.get("category") ?? "General";
  const state        = searchParams.get("state") ?? "All India";
  const qualSlugs    = (searchParams.get("qualifications") ?? "").split(",").filter(Boolean);

  if (!dob || qualSlugs.length === 0) {
    return NextResponse.json({ jobs: [] });
  }

  const dobDate = new Date(dob);
  const ageYears = Math.floor(
    (Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  // Category relaxation map
  const relaxationMap: Record<string, number> = {
    "OBC": 3, "SC": 5, "ST": 5, "EWS": 0, "General": 0, "PwD": 10,
  };
  const relaxation = relaxationMap[category] ?? 0;

  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: { in: ["LIVE", "CLOSING_SOON"] },
        qualifications: {
          some: {
            qualification: { slug: { in: qualSlugs } },
          },
        },
        ...(state !== "All India" ? {
          OR: [
            { isNational: true },
            { state: { name: state } },
          ],
        } : {}),
        OR: [
          { ageMinYears: null },
          { ageMinYears: { lte: ageYears } },
        ],
        AND: [
          {
            OR: [
              { ageMaxYears: null },
              { ageMaxYears: { gte: ageYears - relaxation } },
            ],
          },
        ],
      },
      select: {
        id: true, slug: true, title: true, department: true,
        totalVacancies: true, applicationEndDate: true,
        payScaleText: true, status: true,
      },
      orderBy: [
        { status: "asc" },
        { applicationEndDate: "asc" },
      ],
      take: 50,
    });

    const result = jobs.map((j) => ({
      ...j,
      applicationEndDate: j.applicationEndDate?.toISOString() ?? null,
    }));

    return NextResponse.json({ jobs: result });
  } catch (err) {
    return NextResponse.json({ jobs: [], error: "Query failed" }, { status: 500 });
  }
}


// ============================================================
// apps/web/src/app/api/subscribe/route.ts — Web Push
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {},
      create: {
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}


// ============================================================
// apps/web/src/lib/redis.ts
// ============================================================
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});


// ============================================================
// apps/web/src/lib/prisma.ts
// ============================================================
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


// ============================================================
// apps/web/next.config.ts
// ============================================================
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizeCss: true,
    turbo: {},
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",    value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy",    value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/tools/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;


// ============================================================
// .env.example
// ============================================================
/*
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/sarkaritrack"

# Redis (Upstash for serverless / local Redis for dev)
UPSTASH_REDIS_REST_URL="https://xxxxxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxxxxxxxx"

# AI
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
AI_MODEL="gpt-4o"           # or "claude-3-5-sonnet-20241022"

# Notifications
TELEGRAM_BOT_TOKEN="1234567890:AAxxxxxxxxxxxxxxxx"
TELEGRAM_CHANNEL_ID="@sarkaritrack"
TELEGRAM_ADMIN_CHAT_ID="987654321"
WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="123456789"
WHATSAPP_CHANNEL_NUMBER="+91xxxxxxxxxx"

# Web push (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_PRIVATE_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_CONTACT="mailto:admin@sarkaritrack.in"

# App
NEXT_PUBLIC_SITE_URL="https://sarkaritrack.in"
API_BASE_URL="https://api.sarkaritrack.in"
INTERNAL_API_KEY="super-secret-key-change-me"
NODE_ENV="production"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
*/


# ============================================================
# docker-compose.yml — Local dev stack
# ============================================================
"""
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sarkaritrack
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/sarkaritrack
      UPSTASH_REDIS_REST_URL: http://redis:6379
    depends_on:
      - postgres
      - redis

  api:
    build:
      context: ./services/api
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/sarkaritrack
    depends_on:
      - postgres
      - redis

  agent:
    build:
      context: ./services/agent
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/sarkaritrack
      API_BASE_URL: http://api:8000
    depends_on:
      - api

volumes:
  postgres_data:
"""
