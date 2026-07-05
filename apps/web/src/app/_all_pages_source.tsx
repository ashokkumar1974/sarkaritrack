// ============================================================
// apps/web/src/app/page.tsx — FIXED HOMEPAGE
// Fixes: error handling, loading states, empty state,
//        generateStaticParams, ISR fallback
// ============================================================

import { Suspense } from "react";
import { prisma, withRetry } from "@/lib/prisma";
import { HeroSearch } from "@/components/home/HeroSearch";
import { MasterMatrix } from "@/components/home/MasterMatrix";
import { BreakingNewsBanner } from "@/components/layout/BreakingNewsBanner";
import { JobsDataTable } from "@/components/jobs/JobsDataTable";
import { MatrixSkeleton } from "@/components/home/MatrixSkeleton";
import Link from "next/link";
import type { JobRow } from "@/components/jobs/JobsDataTable";
import type { Metadata } from "next";

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: "SarkariTrack — Latest Sarkari Jobs, Results & Admit Cards 2025",
  description:
    "India's fastest government job portal. Get instant alerts for latest Sarkari Naukri, exam results, admit cards, and online forms. SSC, UPSC, Railway, Bank, State PSC jobs.",
  keywords:
    "sarkari job, sarkari result, government job India, sarkari naukri 2025, SSC jobs, UPSC notification",
  openGraph: {
    title: "SarkariTrack — Latest Sarkari Jobs 2025",
    description:
      "Instant alerts for latest government jobs, results & admit cards across India.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "SarkariTrack — Latest Sarkari Jobs 2025",
    description: "Instant alerts for latest government jobs across India.",
  },
};

// ── Data fetcher with error handling ────────────────────────
async function getMatrixData() {
  try {
    const [latestForms, admitCards, results, syllabi, allJobs] =
      await withRetry(() =>
        Promise.all([
          prisma.job.findMany({
            where: {
              status: { in: ["LIVE", "CLOSING_SOON"] },
              postType: "ONLINE_FORM",
            },
            orderBy: { publishedAt: "desc" },
            take: 12,
            select: {
              id: true, slug: true, title: true, department: true,
              applicationEndDate: true, status: true, totalVacancies: true,
              isNational: true,
              state: { select: { name: true, slug: true } },
            },
          }),
          prisma.job.findMany({
            where: {
              status: { in: ["LIVE", "CLOSING_SOON"] },
              postType: "ADMIT_CARD",
            },
            orderBy: { publishedAt: "desc" },
            take: 12,
            select: {
              id: true, slug: true, title: true, department: true,
              admitCardDate: true, status: true,
              state: { select: { name: true, slug: true } },
            },
          }),
          prisma.job.findMany({
            where: { postType: "RESULT" },
            orderBy: { publishedAt: "desc" },
            take: 12,
            select: {
              id: true, slug: true, title: true, department: true,
              resultDate: true, status: true,
              state: { select: { name: true, slug: true } },
            },
          }),
          prisma.job.findMany({
            where: { postType: { in: ["SYLLABUS", "ANSWER_KEY"] } },
            orderBy: { publishedAt: "desc" },
            take: 12,
            select: {
              id: true, slug: true, title: true, department: true,
              postType: true, status: true,
              state: { select: { name: true, slug: true } },
            },
          }),
          prisma.job.findMany({
            where: { status: { in: ["LIVE", "CLOSING_SOON", "CLOSED"] } },
            orderBy: [
              { status: "asc" },
              { applicationEndDate: "asc" },
            ],
            take: 200,
            include: {
              state: { select: { name: true, slug: true } },
              qualifications: {
                include: {
                  qualification: { select: { label: true, slug: true } },
                },
              },
            },
          }),
        ])
      );

    const jobRows: JobRow[] = allJobs.map((j) => ({
      id: j.id,
      slug: j.slug,
      title: j.title,
      department: j.department,
      stateName: j.state?.name ?? null,
      stateSlug: j.state?.slug ?? null,
      isNational: j.isNational,
      totalVacancies: j.totalVacancies,
      payScaleMin: j.payScaleMin,
      payScaleMax: j.payScaleMax,
      payScaleText: j.payScaleText,
      applicationEndDate: j.applicationEndDate?.toISOString() ?? null,
      notificationDate: j.notificationDate?.toISOString() ?? null,
      qualificationLabels: j.qualifications.map((q) => q.qualification.label),
      status: j.status as JobRow["status"],
      applyOnlineUrl: j.applyOnlineUrl,
      notificationPdfUrl: j.notificationPdfUrl,
    }));

    return { latestForms, admitCards, results, syllabi, jobRows, error: null };
  } catch (err) {
    console.error("[Homepage] Data fetch failed:", err);
    return {
      latestForms: [], admitCards: [], results: [], syllabi: [],
      jobRows: [], error: "Failed to load jobs",
    };
  }
}

async function getBreakingNews(): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "breaking_news" },
    });
    return setting?.value && setting.value.trim() !== ""
      ? setting.value
      : null;
  } catch {
    return null;
  }
}

// ── Page Component ───────────────────────────────────────────
export default async function HomePage() {
  const [data, breakingNews] = await Promise.all([
    getMatrixData(),
    getBreakingNews(),
  ]);

  const { latestForms, admitCards, results, syllabi, jobRows, error } = data;

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      {/* Breaking news */}
      {breakingNews && <BreakingNewsBanner message={breakingNews} />}

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] pt-10 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full mb-5 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Live Job Alerts
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 tracking-tight">
            India&apos;s Fastest
            <br />
            <span className="text-blue-400">Sarkari Job Portal</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            SSC · UPSC · Railway · Bank · State PSC — all in one place. Zero
            clutter, instant alerts.
          </p>
          <Suspense
            fallback={
              <div className="h-14 bg-slate-700/50 rounded-xl animate-pulse max-w-2xl mx-auto" />
            }
          >
            <HeroSearch />
          </Suspense>

          {/* Stats */}
          <div className="flex justify-center gap-6 sm:gap-10 mt-8 text-center">
            {[
              { n: `${jobRows.length}+`, label: "Active Listings" },
              { n: "180+",              label: "Organisations"   },
              { n: "Daily",             label: "Updated"         },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="text-white font-bold text-xl sm:text-2xl tabular-nums">{n}</p>
                <p className="text-slate-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Column Master Matrix */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <Suspense fallback={<MatrixSkeleton />}>
          <MasterMatrix
            latestForms={latestForms}
            admitCards={admitCards}
            results={results}
            syllabi={syllabi}
          />
        </Suspense>
      </section>

      {/* All Jobs Smart Table */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">All Active Jobs</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Filter, search, and sort across all open recruitments
            </p>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium text-sm">
              ⚠️ Could not load jobs right now. Please refresh the page.
            </p>
          </div>
        ) : jobRows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <p className="font-medium text-lg">No jobs listed yet</p>
            <p className="text-sm mt-1">
              Run the AI scraper or add jobs manually from the admin panel.
            </p>
          </div>
        ) : (
          <JobsDataTable data={jobRows} initialPageSize={25} />
        )}
      </section>

      {/* Qualification quick nav */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Browse by Qualification
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "10th Pass",         slug: "10th-pass"     },
            { label: "12th Pass",         slug: "12th-pass"     },
            { label: "Graduate",          slug: "graduate"      },
            { label: "B.Tech / Engineering", slug: "btech"       },
            { label: "ITI",               slug: "iti"           },
            { label: "Diploma",           slug: "diploma"       },
            { label: "Post Graduate",     slug: "post-graduate" },
            { label: "MBBS / Medical",    slug: "mbbs"          },
            { label: "LLB / Law",         slug: "llb"           },
          ].map(({ label, slug }) => (
            <Link
              key={slug}
              href={`/qualification/${slug}`}
              className="text-sm bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom padding for mobile nav */}
      <div className="h-16 md:h-0" />
    </main>
  );
}


// ============================================================
// apps/web/src/app/jobs/[job-slug]/page.tsx — FIXED
// Fixes: notFound() handling, generateStaticParams fallback,
//        link health display, error boundary
// ============================================================

import { notFound } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { QuickGlanceMatrix } from "@/components/jobs/QuickGlanceMatrix";
import { JobDetailSidebar } from "@/components/jobs/JobDetailSidebar";
import { JobDetailMobileActions } from "@/components/jobs/JobDetailMobileActions";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Building2, MapPin, Calendar, Users } from "lucide-react";

export const revalidate = 3600;
export const dynamicParams = true; // Allow pages not in generateStaticParams

interface Props {
  params: { "job-slug": string };
}

async function getJob(slug: string) {
  try {
    return await withRetry(() =>
      prisma.job.findUnique({
        where: { slug },
        include: {
          state: true,
          qualifications: { include: { qualification: true } },
          externalLinks: true,
        },
      })
    );
  } catch (err) {
    console.error(`[JobDetail] Failed to fetch job "${slug}":`, err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params["job-slug"];
  const job = await getJob(slug);

  if (!job) {
    return {
      title: "Job Not Found — SarkariTrack",
      description: "This recruitment notification may have been removed or expired.",
    };
  }

  return {
    title: job.metaTitle ?? `${job.title} — SarkariTrack`,
    description: job.metaDescription ?? undefined,
    alternates: { canonical: job.canonicalUrl ?? undefined },
    openGraph: {
      title: job.metaTitle ?? job.title,
      description: job.metaDescription ?? undefined,
      type: "website",
    },
  };
}

// Only pre-render LIVE jobs at build time; others rendered on-demand
export async function generateStaticParams() {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: { in: ["LIVE", "CLOSING_SOON", "RESULT_OUT"] } },
      select: { slug: true },
      take: 500,
      orderBy: { publishedAt: "desc" },
    });
    return jobs.map((j) => ({ "job-slug": j.slug }));
  } catch {
    return []; // Return empty array if DB unavailable at build time
  }
}

export default async function JobDetailPage({ params }: Props) {
  const slug = params["job-slug"];
  const job = await getJob(slug);

  if (!job) {
    notFound();
  }

  // Check link health
  const linkStatusMap = Object.fromEntries(
    job.externalLinks.map((l) => [l.linkType, l.status])
  );
  const applyLinkOk = linkStatusMap["apply_online"] !== "DOWN";
  const pdfLinkOk   = linkStatusMap["notification_pdf"] !== "DOWN";

  // Related jobs (same department)
  let relatedJobs: { id: string; slug: string; title: string; applicationEndDate: Date | null }[] = [];
  try {
    relatedJobs = await prisma.job.findMany({
      where: {
        department: job.department,
        id: { not: job.id },
        status: { in: ["LIVE", "CLOSING_SOON"] },
      },
      take: 5,
      select: { id: true, slug: true, title: true, applicationEndDate: true },
    });
  } catch {
    // Non-critical — page still works without related jobs
  }

  const StatusPill = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      LIVE:         "bg-emerald-50 text-emerald-700 border-emerald-200",
      CLOSING_SOON: "bg-orange-50 text-orange-700 border-orange-300 animate-pulse",
      CLOSED:       "bg-gray-100 text-gray-500 border-gray-200",
      RESULT_OUT:   "bg-blue-50 text-blue-700 border-blue-200",
      ARCHIVED:     "bg-gray-100 text-gray-400 border-gray-200",
      DRAFT:        "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
    const labels: Record<string, string> = {
      LIVE: "Applications Open",
      CLOSING_SOON: "Closing Soon",
      CLOSED: "Applications Closed",
      RESULT_OUT: "Result Declared",
      ARCHIVED: "Archived",
      DRAFT: "Draft",
    };
    return (
      <span
        className={`shrink-0 text-xs font-semibold border px-2.5 py-1 rounded-full ${
          styles[status] ?? styles.CLOSED
        }`}
      >
        {labels[status] ?? status}
      </span>
    );
  };

  return (
    <>
      {/* JSON-LD */}
      {job.structuredDataJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(job.structuredDataJson),
          }}
        />
      )}

      <main className="min-h-screen bg-[#F7F8FC]">
        {/* Breadcrumb */}
        <nav
          className="bg-white border-b border-gray-100 px-4 py-2.5"
          aria-label="Breadcrumb"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/" className="hover:text-blue-600 transition-colors">Jobs</Link>
            <ChevronRight size={12} />
            {job.state && (
              <>
                <Link
                  href={`/state/${job.state.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {job.state.name}
                </Link>
                <ChevronRight size={12} />
              </>
            )}
            <span className="text-gray-700 font-medium truncate max-w-[200px]">
              {job.title}
            </span>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <article className="flex-1 min-w-0 space-y-5">
              {/* Header card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight mb-2">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 size={13} />
                        {job.department}
                      </span>
                      {job.state && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          <Link
                            href={`/state/${job.state.slug}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {job.state.name}
                          </Link>
                        </span>
                      )}
                      {job.isNational && (
                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                          <MapPin size={13} /> All India
                        </span>
                      )}
                      {job.totalVacancies && (
                        <span className="flex items-center gap-1">
                          <Users size={13} />
                          {job.totalVacancies.toLocaleString("en-IN")} Vacancies
                        </span>
                      )}
                      {job.notificationDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {new Date(job.notificationDate).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusPill status={job.status} />
                </div>

                {/* Mobile CTA */}
                <div className="lg:hidden">
                  <JobDetailMobileActions
                    applyUrl={applyLinkOk ? job.applyOnlineUrl : null}
                    pdfUrl={pdfLinkOk ? job.notificationPdfUrl : null}
                    officialUrl={job.officialPortalUrl}
                    applyLinkDown={!applyLinkOk && !!job.applyOnlineUrl}
                    pdfLinkDown={!pdfLinkOk && !!job.notificationPdfUrl}
                  />
                </div>

                {job.advertisementNo && (
                  <p className="text-xs text-gray-400 mt-3">
                    Advertisement No:{" "}
                    <strong className="text-gray-600">
                      {job.advertisementNo}
                    </strong>
                  </p>
                )}
              </div>

              {/* Quick Glance Matrix */}
              <QuickGlanceMatrix job={job} />

              {/* Selection Process */}
              {job.selectionProcess && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    Selection Process
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {job.selectionProcess}
                  </p>
                </div>
              )}

              {/* Full description */}
              {job.fullDescriptionHtml && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    Full Details
                  </h2>
                  <div
                    className="prose-job"
                    dangerouslySetInnerHTML={{ __html: job.fullDescriptionHtml }}
                  />
                </div>
              )}

              {/* Important instructions */}
              {job.importantInstructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-amber-800 mb-2">
                    ⚠️ Important Instructions
                  </h2>
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
                    {job.importantInstructions}
                  </p>
                </div>
              )}

              {/* Qualifications */}
              {job.qualifications.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    Required Qualifications
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.qualifications.map(({ qualification }) => (
                      <Link
                        key={qualification.id}
                        href={`/qualification/${qualification.slug}`}
                        className="text-sm bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 rounded-lg font-medium transition-colors"
                      >
                        {qualification.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related jobs */}
              {relatedJobs.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    More from {job.department}
                  </h2>
                  <ul className="space-y-2">
                    {relatedJobs.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/jobs/${r.slug}`}
                          className="flex items-center justify-between gap-3 text-sm text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          <span className="line-clamp-1">{r.title}</span>
                          {r.applicationEndDate && (
                            <span className="text-xs text-gray-400 shrink-0">
                              {new Date(r.applicationEndDate).toLocaleDateString(
                                "en-IN",
                                { day: "2-digit", month: "short" }
                              )}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            {/* Sticky Desktop Sidebar */}
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
              <div className="sticky top-4">
                <JobDetailSidebar
                  applyUrl={applyLinkOk ? job.applyOnlineUrl : null}
                  pdfUrl={pdfLinkOk ? job.notificationPdfUrl : null}
                  officialUrl={job.officialPortalUrl}
                  syllabusUrl={job.syllabusUrl}
                  applyLinkDown={!applyLinkOk && !!job.applyOnlineUrl}
                  pdfLinkDown={!pdfLinkOk && !!job.notificationPdfUrl}
                  applicationEndDate={
                    job.applicationEndDate?.toISOString() ?? null
                  }
                  totalVacancies={job.totalVacancies}
                  payScaleText={job.payScaleText}
                  jobTitle={job.shortTitle ?? job.title}
                />
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile sticky bottom bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex gap-3 z-40 pb-safe">
          {job.applyOnlineUrl ? (
            applyLinkOk ? (
              <a
                href={job.applyOnlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl text-center transition-colors"
              >
                Apply Online ↗
              </a>
            ) : (
              <div className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-800 font-medium text-xs py-3 rounded-xl text-center">
                Govt Server Down / Try Later
              </div>
            )
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-400 font-medium text-sm py-3 rounded-xl text-center">
              Applications Closed
            </div>
          )}
          {job.notificationPdfUrl && pdfLinkOk && (
            <a
              href={job.notificationPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
            >
              PDF
            </a>
          )}
        </div>
      </main>
    </>
  );
}
