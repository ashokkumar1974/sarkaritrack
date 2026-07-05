// ============================================================
// packages/shared/src/constants.ts
// Shared constants used across web, admin, and agent
// ============================================================

export const STATES = [
  { name: "Andhra Pradesh",       slug: "andhra-pradesh",    code: "AP" },
  { name: "Arunachal Pradesh",    slug: "arunachal-pradesh", code: "AR" },
  { name: "Assam",                slug: "assam",             code: "AS" },
  { name: "Bihar",                slug: "bihar",             code: "BR" },
  { name: "Chhattisgarh",         slug: "chhattisgarh",      code: "CG" },
  { name: "Goa",                  slug: "goa",               code: "GA" },
  { name: "Gujarat",              slug: "gujarat",           code: "GJ" },
  { name: "Haryana",              slug: "haryana",           code: "HR" },
  { name: "Himachal Pradesh",     slug: "himachal-pradesh",  code: "HP" },
  { name: "Jharkhand",            slug: "jharkhand",         code: "JH" },
  { name: "Karnataka",            slug: "karnataka",         code: "KA" },
  { name: "Kerala",               slug: "kerala",            code: "KL" },
  { name: "Madhya Pradesh",       slug: "madhya-pradesh",    code: "MP" },
  { name: "Maharashtra",          slug: "maharashtra",       code: "MH" },
  { name: "Manipur",              slug: "manipur",           code: "MN" },
  { name: "Meghalaya",            slug: "meghalaya",         code: "ML" },
  { name: "Mizoram",              slug: "mizoram",           code: "MZ" },
  { name: "Nagaland",             slug: "nagaland",          code: "NL" },
  { name: "Odisha",               slug: "odisha",            code: "OD" },
  { name: "Punjab",               slug: "punjab",            code: "PB" },
  { name: "Rajasthan",            slug: "rajasthan",         code: "RJ" },
  { name: "Sikkim",               slug: "sikkim",            code: "SK" },
  { name: "Tamil Nadu",           slug: "tamil-nadu",        code: "TN" },
  { name: "Telangana",            slug: "telangana",         code: "TS" },
  { name: "Tripura",              slug: "tripura",           code: "TR" },
  { name: "Uttar Pradesh",        slug: "uttar-pradesh",     code: "UP" },
  { name: "Uttarakhand",          slug: "uttarakhand",       code: "UK" },
  { name: "West Bengal",          slug: "west-bengal",       code: "WB" },
  { name: "Andaman & Nicobar",    slug: "andaman-nicobar",   code: "AN" },
  { name: "Chandigarh",           slug: "chandigarh",        code: "CH" },
  { name: "Delhi",                slug: "delhi",             code: "DL" },
  { name: "Jammu & Kashmir",      slug: "jammu-kashmir",     code: "JK" },
  { name: "Ladakh",               slug: "ladakh",            code: "LA" },
  { name: "Lakshadweep",          slug: "lakshadweep",       code: "LD" },
  { name: "Puducherry",           slug: "puducherry",        code: "PY" },
  { name: "Dadra & Nagar Haveli", slug: "dadra-nagar-haveli-daman-diu", code: "DD" },
] as const;

export const QUALIFICATIONS = [
  { label: "8th Pass",                       slug: "class-8"       },
  { label: "10th Pass / Matriculation",      slug: "10th-pass"     },
  { label: "12th Pass / Intermediate",       slug: "12th-pass"     },
  { label: "ITI Certificate",                slug: "iti"           },
  { label: "Diploma (Polytechnic)",          slug: "diploma"       },
  { label: "Graduate (Any Stream)",          slug: "graduate"      },
  { label: "B.Tech / B.E. (Engineering)",    slug: "btech"         },
  { label: "Post Graduate / Master's",       slug: "post-graduate" },
  { label: "MBBS / Medical Graduate",        slug: "mbbs"          },
  { label: "LLB / Law Graduate",             slug: "llb"           },
  { label: "CA / CMA / CS",                  slug: "ca"            },
  { label: "PhD / Doctorate",                slug: "phd"           },
] as const;

export const CATEGORIES = [
  { label: "General / EWS", value: "General",  relaxation: 0  },
  { label: "OBC (NCL)",     value: "OBC",      relaxation: 3  },
  { label: "SC",            value: "SC",       relaxation: 5  },
  { label: "ST",            value: "ST",       relaxation: 5  },
  { label: "EWS",           value: "EWS",      relaxation: 0  },
  { label: "PwD (General)", value: "PwD",      relaxation: 10 },
] as const;

export const POST_TYPES = [
  { label: "Online Form",               value: "ONLINE_FORM"              },
  { label: "Admit Card",                value: "ADMIT_CARD"               },
  { label: "Result",                    value: "RESULT"                   },
  { label: "Syllabus",                  value: "SYLLABUS"                 },
  { label: "Answer Key",                value: "ANSWER_KEY"               },
  { label: "Recruitment Notification",  value: "RECRUITMENT_NOTIFICATION" },
] as const;

export const JOB_STATUSES = [
  { label: "Draft",         value: "DRAFT"        },
  { label: "Live",          value: "LIVE"          },
  { label: "Closing Soon",  value: "CLOSING_SOON"  },
  { label: "Closed",        value: "CLOSED"        },
  { label: "Archived",      value: "ARCHIVED"      },
  { label: "Result Out",    value: "RESULT_OUT"    },
] as const;

export const DEPARTMENTS = [
  "UPSC", "SSC", "IBPS", "SBI", "RBI",
  "Railway Recruitment Board", "Indian Army", "Indian Navy",
  "Indian Air Force", "DRDO", "ISRO", "NTPC", "ONGC",
  "BHEL", "Coal India", "HAL", "BEL", "SAIL",
  "Central Police Organisations", "CAPF", "BSF", "CRPF",
  "Border Security Force", "NHM", "AIIMS",
] as const;

export const SALARY_RANGES = [
  { label: "₹10K – ₹30K",  value: "10000-30000"   },
  { label: "₹30K – ₹60K",  value: "30000-60000"   },
  { label: "₹60K – ₹1L",   value: "60000-100000"  },
  { label: "₹1L+",          value: "100000-999999" },
] as const;

export const SITE_CONFIG = {
  name:        "SarkariTrack",
  tagline:     "India's Fastest Government Job Portal",
  baseUrl:     "https://sarkaritrack.in",
  adminUrl:    "https://admin.sarkaritrack.in",
  apiUrl:      "https://api.sarkaritrack.in",
  email:       "contact@sarkaritrack.in",
  telegram:    "https://t.me/sarkaritrack",
  whatsapp:    "https://whatsapp.com/channel/sarkaritrack",
  twitter:     "https://twitter.com/sarkaritrack",
  logoAlt:     "SarkariTrack Logo",
} as const;

export const CLOSING_SOON_THRESHOLD_HOURS = 48;
export const MAX_SEARCH_RESULTS = 10;
export const DEFAULT_PAGE_SIZE  = 25;
export const MAX_PAGE_SIZE      = 100;


// ============================================================
// apps/web/src/app/error.tsx
// Global error boundary for Next.js App Router
// ============================================================
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service (Sentry, etc.)
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#F7F8FC] min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span className="block mt-1 text-xs text-gray-400 font-mono">
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <a
              href="/"
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Home size={14} /> Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}


// ============================================================
// apps/web/src/app/not-found.tsx
// 404 page
// ============================================================
import Link from "next/link";
import { Search, Home, FileText, Trophy, CreditCard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — SarkariTrack",
  description: "The page you are looking for does not exist.",
};

export default function NotFoundPage() {
  const POPULAR_LINKS = [
    { icon: Home,       label: "Latest Jobs",     href: "/"              },
    { icon: Trophy,     label: "Exam Results",    href: "/results"       },
    { icon: CreditCard, label: "Admit Cards",     href: "/admit-cards"   },
    { icon: FileText,   label: "Free Tools",      href: "/tools"         },
  ];

  return (
    <main className="min-h-screen bg-[#F7F8FC] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* 404 visual */}
        <div className="relative mb-8">
          <p className="text-[120px] sm:text-[160px] font-extrabold text-gray-100 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <Search size={32} className="text-gray-300 mx-auto" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
          The job listing, result, or page you're looking for may have been
          removed, expired, or the URL might be incorrect.
        </p>

        {/* Search bar */}
        <form action="/search" className="flex gap-2 mb-8 max-w-md mx-auto">
          <input
            type="search"
            name="q"
            placeholder="Search for jobs, results..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        {/* Popular pages */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Popular Pages
          </p>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_LINKS.map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-sm font-medium px-4 py-3 rounded-xl transition-colors"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/jobs/[job-slug]/loading.tsx
// Loading skeleton for job detail page
// ============================================================
export default function JobDetailLoading() {
  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex gap-2">
          <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-3 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-3 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content skeleton */}
          <div className="flex-1 space-y-4">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
              <div className="h-7 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
              <div className="h-5 bg-gray-100 rounded w-1/2 animate-pulse" />
              <div className="flex gap-3">
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Quick glance skeleton */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="h-12 bg-gray-800 animate-pulse" />
              <div className="p-5 space-y-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/loading.tsx
// Homepage loading skeleton
// ============================================================
export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      {/* Hero skeleton */}
      <section className="bg-[#0F172A] pt-10 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="h-4 w-28 bg-white/10 rounded-full mx-auto animate-pulse" />
          <div className="h-10 w-3/4 bg-white/10 rounded-xl mx-auto animate-pulse" />
          <div className="h-6 w-1/2 bg-white/5 rounded mx-auto animate-pulse" />
          <div className="h-14 bg-white/10 rounded-xl animate-pulse max-w-2xl mx-auto" />
        </div>
      </section>

      {/* Matrix skeleton */}
      <section className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="h-11 bg-gray-300 animate-pulse" />
              <div className="p-3 space-y-3">
                {[...Array(7)].map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded animate-pulse w-full" />
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Table skeleton */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-200" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
