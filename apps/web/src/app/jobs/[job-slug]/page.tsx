// ============================================================
// apps/web/src/app/jobs/[job-slug]/page.tsx
// Job Detail Page — The Ultimate Conversion Page
// ISR revalidate: 3600s + on-demand invalidation on update
// ============================================================

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuickGlanceMatrix } from "@/components/jobs/QuickGlanceMatrix";
import { JobDetailSidebar } from "@/components/jobs/JobDetailSidebar";
import { JobDetailMobileActions } from "@/components/jobs/JobDetailMobileActions";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Building2, MapPin, Calendar, Users } from "lucide-react";

export const revalidate = 3600;

interface Props { params: { "job-slug": string } }

async function getJob(slug: string) {
  return prisma.job.findUnique({
    where: { slug },
    include: {
      state: true,
      qualifications: { include: { qualification: true } },
      externalLinks: true,
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob(params["job-slug"]);
  if (!job) return { title: "Job Not Found" };
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

export async function generateStaticParams() {
  const jobs = await prisma.job.findMany({
    where: { status: { in: ["LIVE", "CLOSING_SOON", "RESULT_OUT"] } },
    select: { slug: true },
    take: 500,
  });
  return jobs.map((j) => ({ "job-slug": j.slug }));
}

export default async function JobDetailPage({ params }: Props) {
  const job = await getJob(params["job-slug"]);
  if (!job) notFound();

  // Check link health from sentinel data
  const linkStatusMap = Object.fromEntries(
    job.externalLinks.map((l) => [l.linkType, l.status])
  );

  const applyLinkOk = linkStatusMap["apply_online"] !== "DOWN";
  const pdfLinkOk   = linkStatusMap["notification_pdf"] !== "DOWN";

  // Related jobs (same department, limited to 5)
  const relatedJobs = await prisma.job.findMany({
    where: {
      department: job.department,
      id: { not: job.id },
      status: { in: ["LIVE", "CLOSING_SOON"] },
    },
    take: 5,
    select: { id: true, slug: true, title: true, applicationEndDate: true },
  });

  return (
    <>
      {/* JSON-LD Structured Data */}
      {job.structuredDataJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(job.structuredDataJson) }}
        />
      )}

      <main className="min-h-screen bg-[#F7F8FC]">
        {/* Breadcrumb */}
        <nav className="bg-white border-b border-gray-100 px-4 py-2.5" aria-label="Breadcrumb">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight size={12} />
            <Link href="/jobs" className="hover:text-blue-600">Jobs</Link>
            <ChevronRight size={12} />
            {job.state && (
              <>
                <Link href={`/state/${job.state.slug}`} className="hover:text-blue-600">
                  {job.state.name}
                </Link>
                <ChevronRight size={12} />
              </>
            )}
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{job.title}</span>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── MAIN CONTENT ── */}
            <article className="flex-1 min-w-0 space-y-6">

              {/* Header card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight mb-2">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 size={13} /> {job.department}
                      </span>
                      {job.state && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} /> {job.state.name}
                        </span>
                      )}
                      {job.isNational && (
                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                          <MapPin size={13} /> All India
                        </span>
                      )}
                      {job.totalVacancies && (
                        <span className="flex items-center gap-1">
                          <Users size={13} /> {job.totalVacancies.toLocaleString("en-IN")} Vacancies
                        </span>
                      )}
                      {job.notificationDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {new Date(job.notificationDate).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusPill status={job.status} endDate={job.applicationEndDate?.toISOString() ?? null} />
                </div>

                {/* Mobile CTA (shown below header on small screens) */}
                <div className="lg:hidden">
                  <JobDetailMobileActions
                    applyUrl={applyLinkOk ? job.applyOnlineUrl : null}
                    pdfUrl={pdfLinkOk ? job.notificationPdfUrl : null}
                    officialUrl={job.officialPortalUrl}
                    applyLinkDown={!applyLinkOk}
                    pdfLinkDown={!pdfLinkOk}
                  />
                </div>

                {/* Advertisement number */}
                {job.advertisementNo && (
                  <p className="text-xs text-gray-400 mt-3">
                    Advertisement No: <strong className="text-gray-600">{job.advertisementNo}</strong>
                  </p>
                )}
              </div>

              {/* Quick Glance Matrix — THE key info block */}
              <QuickGlanceMatrix job={job} />

              {/* Selection Process */}
              {job.selectionProcess && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-3">Selection Process</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{job.selectionProcess}</p>
                </div>
              )}

              {/* Full description */}
              {job.fullDescriptionHtml && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-3">Full Details</h2>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: job.fullDescriptionHtml }}
                  />
                </div>
              )}

              {/* Important instructions */}
              {job.importantInstructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                    ⚠️ Important Instructions
                  </h2>
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
                    {job.importantInstructions}
                  </p>
                </div>
              )}

              {/* Qualification tags */}
              {job.qualifications.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-3">Required Qualifications</h2>
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
                  {job.qualifications[0]?.noteText && (
                    <p className="text-xs text-gray-500 mt-2">{job.qualifications[0].noteText}</p>
                  )}
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
                          className="flex items-center justify-between gap-3 text-sm text-blue-700 hover:text-blue-900 hover:underline group"
                        >
                          <span className="line-clamp-1">{r.title}</span>
                          {r.applicationEndDate && (
                            <span className="text-xs text-gray-400 shrink-0">
                              {new Date(r.applicationEndDate).toLocaleDateString("en-IN", {
                                day: "2-digit", month: "short",
                              })}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            {/* ── STICKY DESKTOP SIDEBAR ── */}
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
              <div className="sticky top-4">
                <JobDetailSidebar
                  applyUrl={applyLinkOk ? job.applyOnlineUrl : null}
                  pdfUrl={pdfLinkOk ? job.notificationPdfUrl : null}
                  officialUrl={job.officialPortalUrl}
                  syllabusUrl={job.syllabusUrl}
                  applyLinkDown={!applyLinkOk}
                  pdfLinkDown={!pdfLinkOk}
                  applicationEndDate={job.applicationEndDate?.toISOString() ?? null}
                  totalVacancies={job.totalVacancies}
                  payScaleText={job.payScaleText}
                  jobTitle={job.shortTitle ?? job.title}
                />
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile sticky bottom bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex gap-3 z-40">
          {job.applyOnlineUrl && applyLinkOk ? (
            <a
              href={job.applyOnlineUrl}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl text-center transition-colors"
            >
              Apply Online ↗
            </a>
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-400 font-medium text-sm py-3 rounded-xl text-center">
              {applyLinkOk ? "Apply Online" : "Govt Server Down"}
            </div>
          )}
          {job.notificationPdfUrl && pdfLinkOk && (
            <a
              href={job.notificationPdfUrl}
              target="_blank" rel="noopener noreferrer"
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

// ──────────────────────────────────────────────
// StatusPill (inline)
// ──────────────────────────────────────────────
function StatusPill({ status, endDate }: { status: string; endDate: string | null }) {
  const styles: Record<string, string> = {
    LIVE:         "bg-emerald-50 text-emerald-700 border-emerald-200",
    CLOSING_SOON: "bg-orange-50 text-orange-700 border-orange-300 animate-pulse",
    CLOSED:       "bg-gray-100 text-gray-500 border-gray-200",
    RESULT_OUT:   "bg-blue-50 text-blue-700 border-blue-200",
    ARCHIVED:     "bg-gray-100 text-gray-400 border-gray-200",
  };
  const labels: Record<string, string> = {
    LIVE: "Applications Open", CLOSING_SOON: "Closing Soon",
    CLOSED: "Applications Closed", RESULT_OUT: "Result Declared", ARCHIVED: "Archived",
  };
  return (
    <span className={`shrink-0 text-xs font-semibold border px-2.5 py-1 rounded-full ${styles[status] ?? styles.CLOSED}`}>
      {labels[status] ?? status}
    </span>
  );
}
