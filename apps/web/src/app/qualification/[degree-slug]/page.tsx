// ============================================================
// apps/web/src/app/state/[state-name]/page.tsx
// Geographic Hub — e.g. /state/uttar-pradesh
// ISR revalidate: 1800s (30 min)
// ============================================================

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JobsDataTable } from "@/components/jobs/JobsDataTable";
import { MapPin, Briefcase, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { JobRow } from "@/components/jobs/JobsDataTable";

export const revalidate = 1800;

interface Props { params: { "state-name": string } }

async function getStateWithJobs(slug: string) {
  const state = await prisma.state.findUnique({
    where: { slug },
    include: {
      jobs: {
        where: { status: { in: ["LIVE", "CLOSING_SOON", "CLOSED"] } },
        orderBy: [{ status: "asc" }, { applicationEndDate: "asc" }],
        take: 150,
        include: {
          state: { select: { name: true, slug: true } },
          qualifications: { include: { qualification: { select: { label: true } } } },
        },
      },
    },
  });
  return state;
}

export async function generateStaticParams() {
  const states = await prisma.state.findMany({ select: { slug: true } });
  return states.map((s) => ({ "state-name": s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const state = await prisma.state.findUnique({
    where: { slug: params["state-name"] },
    select: { name: true, metaTitle: true, metaDesc: true },
  });
  if (!state) return { title: "State Not Found" };
  return {
    title: state.metaTitle ?? `${state.name} Government Jobs 2025 — SarkariTrack`,
    description:
      state.metaDesc ??
      `Latest ${state.name} government job notifications, admit cards, results. SSC, ${state.name} PSC, Police, Teacher, and more sarkari naukri.`,
  };
}

// All Indian states for the sidebar nav
const ALL_STATES = [
  { name: "Andhra Pradesh",     slug: "andhra-pradesh" },
  { name: "Assam",              slug: "assam" },
  { name: "Bihar",              slug: "bihar" },
  { name: "Chhattisgarh",       slug: "chhattisgarh" },
  { name: "Delhi",              slug: "delhi" },
  { name: "Goa",                slug: "goa" },
  { name: "Gujarat",            slug: "gujarat" },
  { name: "Haryana",            slug: "haryana" },
  { name: "Himachal Pradesh",   slug: "himachal-pradesh" },
  { name: "Jharkhand",          slug: "jharkhand" },
  { name: "Karnataka",          slug: "karnataka" },
  { name: "Kerala",             slug: "kerala" },
  { name: "Madhya Pradesh",     slug: "madhya-pradesh" },
  { name: "Maharashtra",        slug: "maharashtra" },
  { name: "Manipur",            slug: "manipur" },
  { name: "Meghalaya",          slug: "meghalaya" },
  { name: "Mizoram",            slug: "mizoram" },
  { name: "Nagaland",           slug: "nagaland" },
  { name: "Odisha",             slug: "odisha" },
  { name: "Punjab",             slug: "punjab" },
  { name: "Rajasthan",          slug: "rajasthan" },
  { name: "Sikkim",             slug: "sikkim" },
  { name: "Tamil Nadu",         slug: "tamil-nadu" },
  { name: "Telangana",          slug: "telangana" },
  { name: "Tripura",            slug: "tripura" },
  { name: "Uttar Pradesh",      slug: "uttar-pradesh" },
  { name: "Uttarakhand",        slug: "uttarakhand" },
  { name: "West Bengal",        slug: "west-bengal" },
  { name: "Jammu & Kashmir",    slug: "jammu-kashmir" },
  { name: "Ladakh",             slug: "ladakh" },
  { name: "Chandigarh",         slug: "chandigarh" },
  { name: "Puducherry",         slug: "puducherry" },
  { name: "Andaman & Nicobar",  slug: "andaman-nicobar" },
  { name: "Lakshadweep",        slug: "lakshadweep" },
  { name: "Dadra & Nagar Haveli", slug: "dadra-nagar-haveli" },
  { name: "Daman & Diu",        slug: "daman-diu" },
];

export default async function StateHubPage({ params }: Props) {
  const state = await getStateWithJobs(params["state-name"]);
  if (!state) notFound();

  const liveCount = state.jobs.filter(
    (j) => j.status === "LIVE" || j.status === "CLOSING_SOON"
  ).length;

  const jobRows: JobRow[] = state.jobs.map((j) => ({
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

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      {/* Hero banner */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#1E293B] px-4 pt-10 pb-14">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={11} />
            <Link href="/state" className="hover:text-white transition-colors">States</Link>
            <ChevronRight size={11} />
            <span className="text-slate-200">{state.name}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <MapPin size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                {state.name} Government Jobs
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                Latest {state.name} sarkari naukri — {state.isUnionTerr ? "Union Territory" : "State"} PSC,
                Police, Teacher, and all department recruitments.
              </p>

              {/* Stats row */}
              <div className="flex gap-5 mt-4">
                {[
                  { icon: Briefcase, value: liveCount, label: "Active Jobs" },
                  { icon: TrendingUp, value: state.jobs.length, label: "Total Listings" },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={14} className="text-blue-400" />
                    <span className="text-white font-bold text-lg tabular-nums">{value}</span>
                    <span className="text-slate-400 text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">

        {/* Jobs table */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            All {state.name} Recruitments
          </h2>
          {jobRows.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No active jobs for {state.name} right now</p>
              <p className="text-sm mt-1">Check back soon or browse All India jobs</p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline font-medium"
              >
                Browse All India Jobs →
              </Link>
            </div>
          ) : (
            <JobsDataTable data={jobRows} initialPageSize={20} />
          )}
        </div>

        {/* State nav sidebar */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Browse by State</p>
            </div>
            <nav className="max-h-[460px] overflow-y-auto py-1">
              {ALL_STATES.map((s) => (
                <Link
                  key={s.slug}
                  href={`/state/${s.slug}`}
                  className={`block px-4 py-2 text-sm transition-colors ${
                    s.slug === params["state-name"]
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/qualification/[degree-slug]/page.tsx
// Qualification Hub — e.g. /qualification/10th-pass
// ISR revalidate: 86400s (24 hr)
// ============================================================

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JobsDataTable } from "@/components/jobs/JobsDataTable";
import { GraduationCap, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { JobRow } from "@/components/jobs/JobsDataTable";
import type { QualificationLevel } from "@prisma/client";

export const revalidate = 86400;

interface QualProps { params: { "degree-slug": string } }

const QUAL_META: Record<string, { title: string; desc: string; tips: string }> = {
  "10th-pass": {
    title: "10th Pass / Matriculation Government Jobs",
    desc: "Latest sarkari jobs for 10th pass candidates. Railway Group D, SSC MTS, Police Constable, Postal, and more central & state govt jobs.",
    tips: "Most 10th pass jobs are in Railways, Postal Department, Police, and Defence. Age limit is usually 18–27 years.",
  },
  "12th-pass": {
    title: "12th Pass Government Jobs",
    desc: "Govt jobs after 12th class — SSC CHSL, Railway Clerk, Bank Clerk, Army, Air Force, Navy, and state government jobs.",
    tips: "SSC CHSL is the biggest exam for 12th pass. Check Railway Recruitment Board for clerk and ticket collector posts.",
  },
  "graduate": {
    title: "Graduation Level Government Jobs",
    desc: "Government jobs for graduates — SSC CGL, UPSC, Bank PO/SO, Railway, and state PSC exams. Thousands of vacancies every year.",
    tips: "SSC CGL, IBPS PO, and State PSC prelims are the most-applied graduate level exams.",
  },
  "btech": {
    title: "B.Tech / Engineering Government Jobs",
    desc: "Engineering graduate govt jobs — UPSC ESE, PSU (ONGC, BHEL, SAIL, NTPC), SSC JE, PWD, and more technical recruitments.",
    tips: "GATE score is used by most PSUs. UPSC ESE (IES) is the top engineering service exam.",
  },
  "iti": {
    title: "ITI Certificate Government Jobs",
    desc: "ITI trade certificate government jobs — Railway apprentice, DRDO, BEL, HAL, Ordnance Factory, and state PWD technical posts.",
    tips: "Railway Apprentice is the largest recruiter for ITI holders with 50,000+ vacancies annually.",
  },
  "diploma": {
    title: "Diploma Government Jobs",
    desc: "Diploma holder government jobs — SSC JE, State JE, PWD, CPWD, Irrigation, and polytechnic-level technical posts.",
    tips: "SSC Junior Engineer (JE) is the flagship exam for diploma holders across civil, electrical, and mechanical trades.",
  },
  "post-graduate": {
    title: "Post Graduate Government Jobs",
    desc: "PG level sarkari jobs — UPSC Civil Services, University/College lecturers, NET, SET, research positions, and specialist officer roles.",
    tips: "UGC NET qualification is mandatory for most teaching positions in central universities.",
  },
  "mbbs": {
    title: "MBBS / Medical Officer Government Jobs",
    desc: "Government medical officer and specialist doctor jobs — UPSC CMS, ESIC, AIIMS, Railway Medical Service, state health departments.",
    tips: "UPSC Combined Medical Services (CMS) exam is the gateway to central government medical posts.",
  },
  "llb": {
    title: "LLB / Law Graduate Government Jobs",
    desc: "Government jobs for law graduates — District Court clerks, public prosecutors, High Court/Supreme Court staff, legal advisors.",
    tips: "State Public Service Commissions regularly recruit Law Officers and Public Prosecutors.",
  },
};

async function getQualificationWithJobs(slug: string) {
  return prisma.qualification.findUnique({
    where: { slug },
    include: {
      jobs: {
        include: {
          job: {
            where: { status: { in: ["LIVE", "CLOSING_SOON", "CLOSED"] } },
            include: {
              state: { select: { name: true, slug: true } },
              qualifications: { include: { qualification: { select: { label: true } } } },
            },
          },
        },
        take: 150,
      },
    },
  });
}

export async function generateStaticParams() {
  const quals = await prisma.qualification.findMany({ select: { slug: true } });
  return quals.map((q) => ({ "degree-slug": q.slug }));
}

export async function generateMetadata({ params }: QualProps): Promise<Metadata> {
  const meta = QUAL_META[params["degree-slug"]];
  const qual = await prisma.qualification.findUnique({
    where: { slug: params["degree-slug"] },
    select: { label: true },
  });
  if (!qual) return { title: "Qualification Not Found" };
  return {
    title: meta?.title ?? `${qual.label} Government Jobs 2025 — SarkariTrack`,
    description: meta?.desc ?? `Latest government jobs for ${qual.label} candidates.`,
  };
}

const QUAL_NAV = [
  { label: "10th Pass",       slug: "10th-pass" },
  { label: "12th Pass",       slug: "12th-pass" },
  { label: "Graduate",        slug: "graduate" },
  { label: "B.Tech / Engg",   slug: "btech" },
  { label: "ITI",             slug: "iti" },
  { label: "Diploma",         slug: "diploma" },
  { label: "Post Graduate",   slug: "post-graduate" },
  { label: "MBBS",            slug: "mbbs" },
  { label: "LLB / Law",       slug: "llb" },
  { label: "CA",              slug: "ca" },
  { label: "PhD",             slug: "phd" },
];

export default async function QualificationHubPage({ params }: QualProps) {
  const qualification = await getQualificationWithJobs(params["degree-slug"]);
  if (!qualification) notFound();

  const meta = QUAL_META[params["degree-slug"]];
  const jobs = qualification.jobs.map((jq) => jq.job).filter(Boolean);

  const liveCount = jobs.filter(
    (j) => j.status === "LIVE" || j.status === "CLOSING_SOON"
  ).length;

  const jobRows: JobRow[] = jobs.map((j) => ({
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

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1040] via-[#2D1B69] to-[#1E293B] px-4 pt-10 pb-14">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight size={11} />
            <Link href="/qualification" className="hover:text-white">By Qualification</Link>
            <ChevronRight size={11} />
            <span className="text-slate-200">{qualification.label}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <GraduationCap size={22} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                {qualification.label} Jobs
              </h1>
              {meta && (
                <p className="text-slate-400 text-sm max-w-xl">{meta.desc}</p>
              )}
              <div className="flex gap-5 mt-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-violet-400" />
                  <span className="text-white font-bold text-lg tabular-nums">{liveCount}</span>
                  <span className="text-slate-400 text-xs">Active Jobs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg tabular-nums">{jobs.length}</span>
                  <span className="text-slate-400 text-xs">Total Listings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          {/* Tips box */}
          {meta?.tips && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-5 flex gap-3">
              <span className="text-lg">💡</span>
              <p className="text-sm text-violet-800 font-medium leading-relaxed">{meta.tips}</p>
            </div>
          )}

          <h2 className="text-lg font-bold text-gray-900 mb-4">
            All Jobs for {qualification.label} Candidates
          </h2>

          {jobRows.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              <GraduationCap size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No active jobs for {qualification.label} right now</p>
              <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline font-medium">
                Browse All Jobs →
              </Link>
            </div>
          ) : (
            <JobsDataTable data={jobRows} initialPageSize={20} />
          )}
        </div>

        {/* Qualification nav */}
        <aside className="w-full lg:w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                By Qualification
              </p>
            </div>
            <nav className="py-1">
              {QUAL_NAV.map((q) => (
                <Link
                  key={q.slug}
                  href={`/qualification/${q.slug}`}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    q.slug === params["degree-slug"]
                      ? "bg-violet-50 text-violet-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {q.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}
