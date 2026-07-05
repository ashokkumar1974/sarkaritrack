// ============================================================
// apps/admin/src/app/jobs/page.tsx
// Admin — All Jobs list with pagination, filters, bulk actions
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, Plus, Edit3, Trash2, Eye, RefreshCw,
  ChevronLeft, ChevronRight, Filter, Download,
} from "lucide-react";

type Status = "ALL" | "DRAFT" | "LIVE" | "CLOSING_SOON" | "CLOSED" | "RESULT_OUT" | "ARCHIVED";

interface AdminJob {
  id: string;
  slug: string;
  title: string;
  department: string;
  status: string;
  postType: string;
  totalVacancies: number | null;
  applicationEndDate: string | null;
  publishedAt: string | null;
  aiParseConfidence: number | null;
  isManualEntry: boolean;
}

interface PaginatedJobs {
  jobs: AdminJob[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  LIVE:         "bg-emerald-100 text-emerald-700",
  CLOSING_SOON: "bg-orange-100 text-orange-700",
  CLOSED:       "bg-gray-100 text-gray-500",
  DRAFT:        "bg-yellow-100 text-yellow-700",
  RESULT_OUT:   "bg-blue-100 text-blue-700",
  ARCHIVED:     "bg-gray-100 text-gray-400",
};

export default function AdminJobsPage() {
  const [data, setData]         = useState<PaginatedJobs | null>(null);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [status, setStatus]     = useState<Status>("ALL");
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "30",
        ...(q ? { q } : {}),
        ...(status !== "ALL" ? { status } : {}),
      });
      const r = await fetch(`/api/admin/jobs?${params}`);
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job permanently?")) return;
    await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
    fetchJobs();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected jobs?`)) return;
    await Promise.all([...selected].map((id) => fetch(`/api/admin/jobs/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    fetchJobs();
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.jobs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.jobs.map((j) => j.id)));
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0F172A] z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
          <span className="text-white/20">/</span>
          <h1 className="text-base font-bold">All Jobs</h1>
          {data && (
            <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full tabular-nums">
              {data.total.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Trash2 size={12} /> Delete {selected.size}
            </button>
          )}
          <button onClick={fetchJobs} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
          </button>
          <Link
            href="/jobs/new"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Job
          </Link>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text" value={q} placeholder="Search jobs..."
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="w-full bg-[#1E293B] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "DRAFT", "LIVE", "CLOSING_SOON", "CLOSED", "RESULT_OUT", "ARCHIVED"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  status === s
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {s === "ALL" ? "All" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1E293B] rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={!!data && selected.size === data.jobs.length && data.jobs.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  {["Title", "Department", "Status", "Vacancies", "Last Date", "Published", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/5 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data?.jobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      No jobs found
                    </td>
                  </tr>
                ) : (
                  data?.jobs.map((job) => (
                    <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(job.id)}
                          onChange={() => toggleSelect(job.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-[280px]">
                        <p className="text-white font-medium text-sm truncate">{job.title}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-xs text-slate-500 font-mono">{job.slug.slice(0, 30)}…</span>
                          {job.isManualEntry && (
                            <span className="text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0 rounded">manual</span>
                          )}
                          {job.aiParseConfidence && (
                            <span className={`text-xs font-bold ${job.aiParseConfidence >= 0.85 ? "text-emerald-400" : "text-amber-400"}`}>
                              {(job.aiParseConfidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">
                        {job.department}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {job.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-bold tabular-nums text-sm">
                        {job.totalVacancies?.toLocaleString("en-IN") ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {job.applicationEndDate
                          ? new Date(job.applicationEndDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {job.publishedAt
                          ? new Date(job.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                          : <span className="text-yellow-500">Unpublished</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <a href={`https://sarkaritrack.in/jobs/${job.slug}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <Eye size={12} />
                          </a>
                          <Link href={`/jobs/${job.id}`}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <Edit3 size={12} />
                          </Link>
                          <button onClick={() => handleDelete(job.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5">
              <span className="text-xs text-slate-400 tabular-nums">
                Page {data.page} of {data.totalPages} · {data.total.toLocaleString("en-IN")} total
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-lg transition-colors">
                  <ChevronLeft size={12} /> Prev
                </button>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-lg transition-colors">
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// apps/web/src/app/search/page.tsx
// Full search results page
// ============================================================
import { prisma } from "@/lib/prisma";
import { JobsDataTable } from "@/components/jobs/JobsDataTable";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import type { JobRow } from "@/components/jobs/JobsDataTable";

interface Props { searchParams: { q?: string } }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = searchParams.q ?? "";
  return {
    title: q ? `"${q}" — Search Results | SarkariTrack` : "Search Government Jobs | SarkariTrack",
    description: `Search results for government jobs matching "${q}" on SarkariTrack.`,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q ?? "").trim();

  const jobs = q.length >= 2
    ? await prisma.job.findMany({
        where: {
          status: { in: ["LIVE", "CLOSING_SOON", "CLOSED", "RESULT_OUT"] },
          OR: [
            { title:      { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
            { shortTitle: { contains: q, mode: "insensitive" } },
            { summaryHtml:{ contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          state: { select: { name: true, slug: true } },
          qualifications: { include: { qualification: { select: { label: true } } } },
        },
        orderBy: [{ status: "asc" }, { publishedAt: "desc" }],
        take: 100,
      })
    : [];

  const jobRows: JobRow[] = jobs.map((j) => ({
    id: j.id, slug: j.slug, title: j.title, department: j.department,
    stateName: j.state?.name ?? null, stateSlug: j.state?.slug ?? null,
    isNational: j.isNational, totalVacancies: j.totalVacancies,
    payScaleMin: j.payScaleMin, payScaleMax: j.payScaleMax, payScaleText: j.payScaleText,
    applicationEndDate: j.applicationEndDate?.toISOString() ?? null,
    notificationDate: j.notificationDate?.toISOString() ?? null,
    qualificationLabels: j.qualifications.map((q) => q.qualification.label),
    status: j.status as JobRow["status"],
    applyOnlineUrl: j.applyOnlineUrl, notificationPdfUrl: j.notificationPdfUrl,
  }));

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      <section className="bg-[#0F172A] px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-xl font-extrabold mb-4">
            {q ? (
              <>Search results for <span className="text-blue-400">"{q}"</span></>
            ) : (
              "Search Government Jobs"
            )}
          </h1>
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="q"
                defaultValue={q}
                type="search"
                placeholder="Search jobs, results, admit cards..."
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-xl text-sm transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {q.length < 2 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Enter at least 2 characters to search</p>
          </div>
        ) : jobRows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-lg">No results for "{q}"</p>
            <p className="text-sm mt-1">Try different keywords or browse by state / qualification</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Found <strong>{jobRows.length}</strong> results for "{q}"
            </p>
            <JobsDataTable data={jobRows} initialPageSize={25} />
          </>
        )}
      </div>
    </main>
  );
}


// ============================================================
// FastAPI addition — services/api/main.py (append these routes)
// Admin jobs GET with pagination + revenue snapshot endpoint
// ============================================================

/*
Add these routes to services/api/main.py:

@app.get("/api/admin/jobs", dependencies=[Depends(require_api_key)])
async def get_admin_jobs(
    page: int = Query(1),
    pageSize: int = Query(30),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * pageSize
    where_clauses = []
    params: dict = {"limit": pageSize, "offset": offset}

    if status and status != "ALL":
        where_clauses.append('"status" = :status')
        params["status"] = status
    if q:
        where_clauses.append('(title ILIKE :q OR department ILIKE :q)')
        params["q"] = f"%{q}%"

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    total_row = db.execute(
        text(f'SELECT COUNT(*) FROM "Job" {where_sql}'), params
    ).fetchone()
    total = int(total_row[0])

    rows = db.execute(text(f"""
        SELECT id, slug, title, department, status, "postType",
               "totalVacancies", "applicationEndDate", "publishedAt",
               "aiParseConfidence", "isManualEntry"
        FROM "Job"
        {where_sql}
        ORDER BY "createdAt" DESC
        LIMIT :limit OFFSET :offset
    """), params).fetchall()

    return {
        "jobs": [
            {
                "id": r[0], "slug": r[1], "title": r[2], "department": r[3],
                "status": r[4], "postType": r[5], "totalVacancies": r[6],
                "applicationEndDate": r[7].isoformat() if r[7] else None,
                "publishedAt": r[8].isoformat() if r[8] else None,
                "aiParseConfidence": float(r[9]) if r[9] else None,
                "isManualEntry": r[10],
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": max(1, -(-total // pageSize)),  # ceil division
    }


@app.get("/api/admin/jobs/{job_id}", dependencies=[Depends(require_api_key)])
async def get_job(job_id: str, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT id, slug, title, "shortTitle", status, department, "organizationCode",
               "advertisementNo", "isNational", "totalVacancies",
               "applicationStartDate", "applicationEndDate", "examDate",
               "feeGeneral", "feeOBCEWS", "feeSCSTFemale",
               "ageMinYears", "ageMaxYears", "payScaleText",
               "selectionProcess", "applyOnlineUrl", "notificationPdfUrl",
               "officialPortalUrl", "metaTitle", "metaDescription",
               "importantInstructions", "aiParseConfidence", "isManualEntry"
        FROM "Job" WHERE id = :id LIMIT 1
    """), {"id": job_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    keys = [
        "id","slug","title","shortTitle","status","department","organizationCode",
        "advertisementNo","isNational","totalVacancies",
        "applicationStartDate","applicationEndDate","examDate",
        "feeGeneral","feeOBCEWS","feeSCSTFemale",
        "ageMinYears","ageMaxYears","payScaleText",
        "selectionProcess","applyOnlineUrl","notificationPdfUrl",
        "officialPortalUrl","metaTitle","metaDescription",
        "importantInstructions","aiParseConfidence","isManualEntry",
    ]
    d = dict(zip(keys, row))
    for k in ["applicationStartDate","applicationEndDate","examDate"]:
        if d[k]: d[k] = d[k].isoformat()
    return d


@app.patch("/api/admin/jobs/{job_id}", dependencies=[Depends(require_api_key)])
async def patch_job(job_id: str, payload: JobUpdatePayload, db: Session = Depends(get_db)):
    fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not fields:
        return {"success": True}
    set_clause = ", ".join([f'"{k}" = :{k}' for k in fields])
    fields["id"] = job_id
    fields["now"] = datetime.now(timezone.utc)
    db.execute(
        text(f'UPDATE "Job" SET {set_clause}, "updatedAt" = :now WHERE id = :id'),
        fields
    )
    db.commit()
    return {"success": True}


@app.post("/api/admin/revenue-snapshot", dependencies=[Depends(require_api_key)])
async def create_revenue_snapshot(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    # In production pull these from Google Analytics API + AdSense API
    # For now insert zeros so the table row exists for today
    db.execute(text("""
        INSERT INTO "RevenueSnapshot" (id, date, "adsenseRevenue", "affiliateClicks",
                                       "affiliateRev", "pageViews", "uniqueVisitors",
                                       "newSubscribers", "createdAt")
        VALUES (gen_random_uuid()::text, :date, 0, 0, 0, 0, 0, 0, :now)
        ON CONFLICT (date) DO NOTHING
    """), {"date": today, "now": datetime.now(timezone.utc)})
    db.commit()
    return {"success": True, "date": str(today)}
*/
