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
