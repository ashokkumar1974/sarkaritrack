// ============================================================
// apps/web/src/app/results/page.tsx
// Exam Results Hub
// ============================================================

import { prisma } from "@/lib/prisma";
import { JobsDataTable } from "@/components/jobs/JobsDataTable";
import { Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { JobRow } from "@/components/jobs/JobsDataTable";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Sarkari Results 2025 — Latest Exam Results | SarkariTrack",
  description:
    "Check latest government exam results 2025 — SSC CGL, UPSC, Railway, IBPS, State PSC results. Direct links to official result PDFs and merit lists.",
};

export default async function ResultsPage() {
  const results = await prisma.job.findMany({
    where: { postType: "RESULT" },
    orderBy: { publishedAt: "desc" },
    take: 200,
    include: {
      state: { select: { name: true, slug: true } },
      qualifications: { include: { qualification: { select: { label: true } } } },
    },
  });

  const jobRows: JobRow[] = results.map((j) => ({
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
    applicationEndDate: j.resultDate?.toISOString() ?? null,
    notificationDate: j.notificationDate?.toISOString() ?? null,
    qualificationLabels: j.qualifications.map((q) => q.qualification.label),
    status: "RESULT_OUT" as JobRow["status"],
    applyOnlineUrl: j.applyOnlineUrl,
    notificationPdfUrl: j.notificationPdfUrl,
  }));

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#14532d] to-[#1E293B] px-4 pt-10 pb-14">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight size={11} />
            <span className="text-slate-200">Exam Results</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Trophy size={22} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                Sarkari Exam Results 2025
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                Latest government exam results — SSC, UPSC, Railway, Bank, Police & State PSC.
                Direct links to official result PDFs and merit lists.
              </p>
              <div className="flex gap-5 mt-4">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-emerald-400" />
                  <span className="text-white font-bold text-lg tabular-nums">{results.length}</span>
                  <span className="text-slate-400 text-xs">Results Listed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">All Recent Results</h2>
        {jobRows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <Trophy size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No results published yet</p>
          </div>
        ) : (
          <JobsDataTable data={jobRows} initialPageSize={25} />
        )}
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/admit-cards/page.tsx
// Admit Cards Hub
// ============================================================

import { prisma } from "@/lib/prisma";
import { JobsDataTable } from "@/components/jobs/JobsDataTable";
import { CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { JobRow } from "@/components/jobs/JobsDataTable";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Sarkari Admit Card 2025 — Download Hall Tickets | SarkariTrack",
  description:
    "Download latest government exam admit cards & hall tickets 2025. SSC, UPSC, Railway, IBPS, Police, State PSC call letters with direct official links.",
};

export default async function AdmitCardsPage() {
  const admitCards = await prisma.job.findMany({
    where: { postType: "ADMIT_CARD" },
    orderBy: [{ status: "asc" }, { admitCardDate: "desc" }],
    take: 200,
    include: {
      state: { select: { name: true, slug: true } },
      qualifications: { include: { qualification: { select: { label: true } } } },
    },
  });

  const jobRows: JobRow[] = admitCards.map((j) => ({
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
    applicationEndDate: j.admitCardDate?.toISOString() ?? null,
    notificationDate: j.notificationDate?.toISOString() ?? null,
    qualificationLabels: j.qualifications.map((q) => q.qualification.label),
    status: j.status as JobRow["status"],
    applyOnlineUrl: j.applyOnlineUrl,
    notificationPdfUrl: j.notificationPdfUrl,
  }));

  const liveCount = admitCards.filter(
    (j) => j.status === "LIVE" || j.status === "CLOSING_SOON"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1e1b4b] to-[#1E293B] px-4 pt-10 pb-14">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight size={11} />
            <span className="text-slate-200">Admit Cards</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <CreditCard size={22} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                Sarkari Admit Card 2025
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                Download government exam admit cards and hall tickets. Direct links to official
                portals — no registration required.
              </p>
              <div className="flex gap-5 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-white font-bold text-lg tabular-nums">{liveCount}</span>
                  <span className="text-slate-400 text-xs">Active Now</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg tabular-nums">{admitCards.length}</span>
                  <span className="text-slate-400 text-xs">Total Listed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">All Admit Cards</h2>
        {jobRows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No admit cards published yet</p>
          </div>
        ) : (
          <JobsDataTable data={jobRows} initialPageSize={25} />
        )}
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/tools/page.tsx
// Free Tools Hub — all tools in one page
// ============================================================

import Link from "next/link";
import { Image, Calendar, Zap, ArrowRight, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Sarkari Job Tools 2025 — Photo Resizer, Age Calculator | SarkariTrack",
  description:
    "Free tools for government job applicants — resize photo/signature to exact specs, calculate age with relaxation, find all jobs you're eligible for.",
};

const TOOLS = [
  {
    href: "/tools/photo-signature-resizer",
    icon: Image,
    color: "bg-blue-600",
    badge: "Most Used",
    title: "Photo & Signature Resizer",
    description:
      "Resize and compress your photo and signature to exact government specifications (20KB, 50KB, 100KB). Works 100% offline in your browser — no upload to server.",
    features: [
      "6 official government presets",
      "Custom width × height × file size",
      "JPEG & PNG output",
      "Instant client-side processing",
    ],
  },
  {
    href: "/tools/sarkari-age-calculator",
    icon: Calendar,
    color: "bg-violet-600",
    badge: "Popular",
    title: "Sarkari Age Calculator",
    description:
      "Calculate your exact age as on the recruitment cutoff date. Includes category-wise age relaxation for OBC, SC/ST, PwD, and Ex-Serviceman candidates.",
    features: [
      "Exact age in years, months, days",
      "All category relaxations",
      "Eligibility verdict (pass/fail)",
      "Any custom cutoff date",
    ],
  },
  {
    href: "/tools/smart-eligibility-engine",
    icon: Zap,
    color: "bg-amber-500",
    badge: "New",
    title: "Smart Eligibility Engine",
    description:
      "Enter your profile once (age, category, qualifications, state) and instantly see every active government job you're eligible to apply for right now.",
    features: [
      "Age + category auto-matching",
      "Multi-qualification filter",
      "State preference support",
      "Profile saved locally",
    ],
  },
];

export default function ToolsHubPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-4 pt-12 pb-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-wide">
            <Star size={11} /> 100% Free — No Login Required
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Free Tools for Sarkari Job Applicants
          </h1>
          <p className="text-slate-400 text-base">
            Tools built specifically for Indian government job seekers.
            All processing happens in your browser — your data never leaves your device.
          </p>
        </div>
      </section>

      {/* Tools grid */}
      <section className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden flex flex-col"
            >
              {/* Card header */}
              <div className={`${tool.color} px-5 py-6 relative`}>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={22} className="text-white" />
                </div>
                {tool.badge && (
                  <span className="absolute top-4 right-4 text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                    {tool.badge}
                  </span>
                )}
                <h2 className="text-lg font-extrabold text-white leading-tight">{tool.title}</h2>
              </div>

              {/* Card body */}
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{tool.description}</p>
                <ul className="space-y-1.5 flex-1">
                  {tool.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-sm font-bold text-blue-600 mt-5 group-hover:gap-2 transition-all">
                  Open Tool <ArrowRight size={15} />
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* CTA strip */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="bg-blue-600 rounded-2xl px-6 py-8 text-center text-white">
          <h2 className="text-xl font-extrabold mb-2">Need a specific tool?</h2>
          <p className="text-blue-100 text-sm mb-4">
            Tell us what would help you most — we build tools based on user requests.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            Request a Tool <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}


// ============================================================
// apps/admin/src/app/jobs/[id]/page.tsx
// Admin Job Editor — manual CRUD form
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Save, ArrowLeft, ExternalLink, Loader2, Trash2,
  CheckCircle, AlertTriangle, Globe
} from "lucide-react";

interface JobEditForm {
  title: string;
  shortTitle: string;
  status: string;
  department: string;
  totalVacancies: string;
  applicationStartDate: string;
  applicationEndDate: string;
  examDate: string;
  feeGeneral: string;
  feeOBCEWS: string;
  feeSCSTFemale: string;
  ageMinYears: string;
  ageMaxYears: string;
  payScaleText: string;
  selectionProcess: string;
  applyOnlineUrl: string;
  notificationPdfUrl: string;
  officialPortalUrl: string;
  metaTitle: string;
  metaDescription: string;
  importantInstructions: string;
}

const EMPTY_FORM: JobEditForm = {
  title: "", shortTitle: "", status: "DRAFT", department: "",
  totalVacancies: "", applicationStartDate: "", applicationEndDate: "",
  examDate: "", feeGeneral: "", feeOBCEWS: "", feeSCSTFemale: "",
  ageMinYears: "", ageMaxYears: "", payScaleText: "", selectionProcess: "",
  applyOnlineUrl: "", notificationPdfUrl: "", officialPortalUrl: "",
  metaTitle: "", metaDescription: "", importantInstructions: "",
};

export default function JobEditorPage() {
  const params   = useParams();
  const router   = useRouter();
  const jobId    = params.id as string;
  const isNew    = jobId === "new";

  const [form, setForm]       = useState<JobEditForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title:                data.title ?? "",
          shortTitle:           data.shortTitle ?? "",
          status:               data.status ?? "DRAFT",
          department:           data.department ?? "",
          totalVacancies:       data.totalVacancies?.toString() ?? "",
          applicationStartDate: data.applicationStartDate?.slice(0, 10) ?? "",
          applicationEndDate:   data.applicationEndDate?.slice(0, 10) ?? "",
          examDate:             data.examDate?.slice(0, 10) ?? "",
          feeGeneral:           data.feeGeneral?.toString() ?? "",
          feeOBCEWS:            data.feeOBCEWS?.toString() ?? "",
          feeSCSTFemale:        data.feeSCSTFemale?.toString() ?? "",
          ageMinYears:          data.ageMinYears?.toString() ?? "",
          ageMaxYears:          data.ageMaxYears?.toString() ?? "",
          payScaleText:         data.payScaleText ?? "",
          selectionProcess:     data.selectionProcess ?? "",
          applyOnlineUrl:       data.applyOnlineUrl ?? "",
          notificationPdfUrl:   data.notificationPdfUrl ?? "",
          officialPortalUrl:    data.officialPortalUrl ?? "",
          metaTitle:            data.metaTitle ?? "",
          metaDescription:      data.metaDescription ?? "",
          importantInstructions: data.importantInstructions ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [jobId, isNew]);

  const set = (key: keyof JobEditForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (publishAfter = false) => {
    setSaving(true); setError(null);
    try {
      const method = isNew ? "POST" : "PATCH";
      const url    = isNew ? "/api/admin/jobs" : `/api/admin/jobs/${jobId}`;
      const body   = {
        ...form,
        totalVacancies: form.totalVacancies ? parseInt(form.totalVacancies) : null,
        feeGeneral:     form.feeGeneral ? parseInt(form.feeGeneral) : null,
        feeOBCEWS:      form.feeOBCEWS ? parseInt(form.feeOBCEWS) : null,
        feeSCSTFemale:  form.feeSCSTFemale ? parseInt(form.feeSCSTFemale) : null,
        ageMinYears:    form.ageMinYears ? parseInt(form.ageMinYears) : null,
        ageMaxYears:    form.ageMaxYears ? parseInt(form.ageMaxYears) : null,
        isManualEntry:  true,
      };
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      const { id } = await r.json();

      if (publishAfter) {
        await fetch(`/api/admin/jobs/${id ?? jobId}/publish`, { method: "POST" });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (isNew) router.push(`/jobs/${id}/edit`);
    } catch (e: any) {
      setError(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job permanently?")) return;
    await fetch(`/api/admin/jobs/${jobId}`, { method: "DELETE" });
    router.push("/jobs");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  const Field = ({
    label, field, type = "text", placeholder = "",
  }: { label: string; field: keyof JobEditForm; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={set(field)}
        placeholder={placeholder}
        className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );

  const TextArea = ({ label, field }: { label: string; field: keyof JobEditForm }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
      <textarea
        value={form[field]}
        onChange={set(field)}
        rows={3}
        className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0F172A] z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold">{isNew ? "Add New Job" : "Edit Job"}</h1>
          {!isNew && (
            <a
              href={`/jobs/${jobId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <Globe size={12} /> View Live
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
              <CheckCircle size={14} /> Saved
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-red-400 text-xs">
              <AlertTriangle size={13} /> {error}
            </span>
          )}
          {!isNew && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
            Save & Publish
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left column */}
        <div className="space-y-5">
          <section className="bg-[#1E293B] rounded-xl border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Basic Info</h2>
            <Field label="Job Title *"       field="title"       placeholder="e.g. SSC CGL 2025 Combined Graduate Level" />
            <Field label="Short Title"        field="shortTitle"  placeholder="Max 80 chars for notifications" />
            <Field label="Department / Organisation *" field="department" placeholder="e.g. Staff Selection Commission" />
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {["DRAFT", "LIVE", "CLOSING_SOON", "CLOSED", "RESULT_OUT", "ARCHIVED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <Field label="Total Vacancies"   field="totalVacancies" type="number" placeholder="e.g. 17727" />
            <Field label="Pay Scale Text"    field="payScaleText"   placeholder="e.g. Level-7 (₹44,900–₹1,42,400)" />
          </section>

          <section className="bg-[#1E293B] rounded-xl border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Key Dates</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Application Start" field="applicationStartDate" type="date" />
              <Field label="Application End"   field="applicationEndDate"   type="date" />
              <Field label="Exam Date"         field="examDate"             type="date" />
            </div>
          </section>

          <section className="bg-[#1E293B] rounded-xl border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Application Fees (₹)</h2>
            <div className="grid grid-cols-3 gap-3">
              <Field label="General / OBC" field="feeGeneral"    type="number" placeholder="500" />
              <Field label="OBC / EWS"     field="feeOBCEWS"     type="number" placeholder="500" />
              <Field label="SC/ST/Female"  field="feeSCSTFemale" type="number" placeholder="0" />
            </div>
          </section>

          <section className="bg-[#1E293B] rounded-xl border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Age Limit</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min Age (years)" field="ageMinYears" type="number" placeholder="18" />
              <Field label="Max Age (years)" field="ageMaxYears" type="number" placeholder="27" />
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <section className="bg-[#1E293B] rounded-xl border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Links</h2>
            <Field label="Apply Online URL"        field="applyOnlineUrl"      placeholder="https://..." />
            <Field label="Notification PDF URL"    field="notificationPdfUrl"  placeholder="https://...pdf" />
            <Field label="Official Portal URL"     field="officialPortalUrl"   placeholder="https://..." />
          </section>

          <section className="bg-[#1E293B] rounded-xl border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">SEO</h2>
            <Field label="Meta Title (max 70 chars)"       field="metaTitle"       placeholder="SSC CGL 2025 — Apply Online | SarkariTrack" />
            <TextArea label="Meta Description (max 160 chars)" field="metaDescription" />
          </section>

          <section className="bg-[#1E293B] rounded-xl border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Content</h2>
            <TextArea label="Selection Process"       field="selectionProcess" />
            <TextArea label="Important Instructions"  field="importantInstructions" />
          </section>
        </div>
      </div>
    </div>
  );
}
