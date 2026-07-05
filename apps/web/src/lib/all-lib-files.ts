// ============================================================
// apps/web/src/lib/prisma.ts — FIXED (retry + singleton)
// ============================================================

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    // Connection pool settings for serverless (Vercel)
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });
  return client;
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

/**
 * Retry a Prisma query on connection errors.
 * Useful on Railway/Vercel cold starts where DB may need a moment.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnectionError =
        err?.code === "P1001" ||   // "Can't reach database server"
        err?.code === "P1002" ||   // "Database server timeout"
        err?.code === "P2024" ||   // "Connection pool timeout"
        err?.message?.includes("Connection refused") ||
        err?.message?.includes("ECONNREFUSED");

      if (isConnectionError && i < retries - 1) {
        console.warn(`[Prisma] Connection error, retrying (${i + 1}/${retries})...`);
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withRetry: exhausted all retries");
}


// ============================================================
// apps/web/src/lib/redis.ts — FIXED (graceful fallback)
// ============================================================

let redis: any = null;

function getRedis() {
  if (redis) return redis;

  // Upstash Redis (production)
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    !process.env.UPSTASH_REDIS_REST_URL.includes("localhost")
  ) {
    const { Redis } = require("@upstash/redis");
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis;
  }

  // Local dev fallback — no-op cache that never throws
  console.warn("[Redis] No Upstash config found — using no-op cache for local dev");
  redis = {
    get:    async () => null,
    set:    async () => "OK",
    del:    async () => 1,
    expire: async () => 1,
    incr:   async () => 1,
  };
  return redis;
}

export { getRedis as redis };

// Usage: const r = redis(); await r.get("key");


// ============================================================
// apps/web/src/lib/env.ts — Runtime env validator
// Crashes with a CLEAR error message if something is missing
// ============================================================

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === "") {
    throw new Error(
      `\n\n❌ MISSING ENVIRONMENT VARIABLE: "${key}"\n` +
      `   Add it to your .env file or Vercel/Railway dashboard.\n` +
      `   See .env.example for all required variables.\n`
    );
  }
  return val;
}

function optionalEnv(key: string, defaultVal = ""): string {
  return process.env[key] ?? defaultVal;
}

// ── Export typed config ──────────────────────────────────
export const env = {
  // Required
  DATABASE_URL:          requireEnv("DATABASE_URL"),
  INTERNAL_API_KEY:      requireEnv("INTERNAL_API_KEY"),
  NEXT_PUBLIC_SITE_URL:  requireEnv("NEXT_PUBLIC_SITE_URL"),

  // Optional — features degrade gracefully without these
  OPENAI_API_KEY:        optionalEnv("OPENAI_API_KEY"),
  ANTHROPIC_API_KEY:     optionalEnv("ANTHROPIC_API_KEY"),
  API_BASE_URL:          optionalEnv("API_BASE_URL", "http://localhost:8000"),

  // Push notifications
  VAPID_PUBLIC_KEY:      optionalEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
  VAPID_PRIVATE_KEY:     optionalEnv("VAPID_PRIVATE_KEY"),
  VAPID_CONTACT:         optionalEnv("VAPID_CONTACT", "mailto:admin@sarkaritrack.in"),

  // Messaging
  TELEGRAM_BOT_TOKEN:    optionalEnv("TELEGRAM_BOT_TOKEN"),
  TELEGRAM_CHANNEL_ID:   optionalEnv("TELEGRAM_CHANNEL_ID"),
  WHATSAPP_ACCESS_TOKEN: optionalEnv("WHATSAPP_ACCESS_TOKEN"),
  WHATSAPP_PHONE_ID:     optionalEnv("WHATSAPP_PHONE_NUMBER_ID"),

  // Revalidation
  REVALIDATE_SECRET:     optionalEnv("NEXTJS_REVALIDATE_SECRET"),

  // Feature flags
  isProd:     process.env.NODE_ENV === "production",
  isDev:      process.env.NODE_ENV === "development",
  isTest:     process.env.NODE_ENV === "test",

  // AI model selection
  aiModel: process.env.AI_MODEL ??
    (process.env.ANTHROPIC_API_KEY ? "claude-3-5-sonnet-20241022" : "gpt-4o"),
} as const;

// Warn about missing optional features in dev
if (process.env.NODE_ENV === "development") {
  const optionalWarnings = [
    ["OPENAI_API_KEY or ANTHROPIC_API_KEY", !env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY],
    ["TELEGRAM_BOT_TOKEN", !env.TELEGRAM_BOT_TOKEN],
    ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", !env.VAPID_PUBLIC_KEY],
  ] as [string, boolean][];

  optionalWarnings.filter(([, missing]) => missing).forEach(([key]) => {
    console.warn(`[env] ⚠️  Optional: ${key} not set — related features will be disabled`);
  });
}


// ============================================================
// apps/web/src/lib/utils.ts — FIXED (complete version)
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function daysUntil(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const end = new Date(isoDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatIndianNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN");
}

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function timeAgo(isoDate: string | null | undefined): string {
  if (!isoDate) return "Never";
  const diff = Date.now() - new Date(isoDate).getTime();
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(isoDate);
}

export function calcExactAge(
  dob: Date,
  reference: Date = new Date()
): { years: number; months: number; days: number } {
  let years  = reference.getFullYear() - dob.getFullYear();
  let months = reference.getMonth()    - dob.getMonth();
  let days   = reference.getDate()     - dob.getDate();
  if (days   < 0) {
    months--;
    days += new Date(reference.getFullYear(), reference.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  return { years, months, days };
}

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

/**
 * Safe JSON parse — returns null on failure instead of throwing.
 */
export function safeJsonParse<T>(str: string | null | undefined): T | null {
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
