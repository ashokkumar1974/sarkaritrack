// ============================================================
// apps/admin/src/app/dashboard/page.tsx
// Single-Screen Executive Dashboard
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, TrendingUp, Activity, AlertTriangle, CheckCircle,
  XCircle, RefreshCw, DollarSign, Eye, MousePointerClick,
  Zap, Clock, Server, Edit3, Trash2, ToggleLeft, ToggleRight,
  Bell, Database, Link as LinkIcon, FileText,
} from "lucide-react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface DashboardStats {
  liveVisitors: number;
  todayPageViews: number;
  todayUniqueVisitors: number;
  adsenseRevToday: number;
  adsenseRevMonth: number;
  affiliateClicksToday: number;
  affiliateRevToday: number;
  totalLiveJobs: number;
  totalClosingSoon: number;
  totalDraftJobs: number;
  newJobsToday: number;
  pushSubscribers: number;
  telegramSubscribers: number;
}

interface ScraperHealth {
  id: string;
  name: string;
  slug: string;
  lastRunAt: string | null;
  lastStatus: "SUCCESS" | "PARTIAL" | "FAILED" | "RUNNING" | "SKIPPED" | null;
  jobsFoundLast: number;
  isActive: boolean;
  cronSchedule: string;
}

interface DeadLink {
  id: string;
  jobTitle: string;
  jobSlug: string;
  linkType: string;
  url: string;
  httpStatus: number | null;
  downSince: string;
}

interface JobDraft {
  id: string;
  title: string;
  department: string;
  totalVacancies: number | null;
  applicationEndDate: string | null;
  aiParseConfidence: number | null;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color = "blue", loading = false,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color?: string; loading?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue:    "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber:   "bg-amber-50 text-amber-600",
    violet:  "bg-violet-50 text-violet-600",
    red:     "bg-red-50 text-red-600",
    gray:    "bg-gray-100 text-gray-500",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium truncate">{label}</p>
        {loading ? (
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl font-extrabold text-gray-900 tabular-nums leading-tight">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
        )}
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ScraperStatusBadge({ status }: { status: ScraperHealth["lastStatus"] }) {
  const map: Record<string, { cls: string; label: string; Icon: React.ElementType }> = {
    SUCCESS: { cls: "bg-emerald-100 text-emerald-700", label: "Success", Icon: CheckCircle },
    PARTIAL: { cls: "bg-amber-100 text-amber-700",    label: "Partial", Icon: AlertTriangle },
    FAILED:  { cls: "bg-red-100 text-red-700",         label: "Failed",  Icon: XCircle },
    RUNNING: { cls: "bg-blue-100 text-blue-700",       label: "Running", Icon: RefreshCw },
    SKIPPED: { cls: "bg-gray-100 text-gray-500",       label: "Skipped", Icon: Clock },
  };
  if (!status) return <span className="text-xs text-gray-400">Never run</span>;
  const { cls, label, Icon } = map[status] ?? map.SKIPPED;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={11} className={status === "RUNNING" ? "animate-spin" : ""} />
      {label}
    </span>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ──────────────────────────────────────────────
// Main Dashboard
// ──────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scrapers, setScrapers] = useState<ScraperHealth[]>([]);
  const [deadLinks, setDeadLinks] = useState<DeadLink[]>([]);
  const [drafts, setDrafts] = useState<JobDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"drafts" | "links" | "scrapers">("drafts");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, scrapersRes, linksRes, draftsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/scrapers"),
        fetch("/api/admin/dead-links"),
        fetch("/api/admin/drafts"),
      ]);
      const [s, sc, dl, dr] = await Promise.all([
        statsRes.json(), scrapersRes.json(), linksRes.json(), draftsRes.json(),
      ]);
      setStats(s);
      setScrapers(sc.scrapers ?? []);
      setDeadLinks(dl.links ?? []);
      setDrafts(dr.jobs ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Dashboard fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 30s for live visitor count
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      await fetch(`/api/admin/jobs/${id}/publish`, { method: "POST" });
      setDrafts((prev) => prev.filter((j) => j.id !== id));
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this job draft?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
      setDrafts((prev) => prev.filter((j) => j.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleScraper = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/scrapers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setScrapers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !isActive } : s))
    );
  };

  const handleRunScraper = async (id: string) => {
    await fetch(`/api/admin/scrapers/${id}/run`, { method: "POST" });
    setScrapers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lastStatus: "RUNNING" } : s))
    );
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-[#0F172A] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <h1 className="text-base font-bold text-white">SarkariTrack Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Last updated: {lastRefresh.toLocaleTimeString("en-IN")}
          </span>
          <button
            onClick={fetchAll}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
          </button>
          <a
            href="/jobs"
            target="_blank"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            View Site ↗
          </a>
        </div>
      </header>

      <div className="p-6 space-y-6">

        {/* ── LIVE PULSE ── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {loading ? "..." : stats?.liveVisitors ?? 0} LIVE VISITORS
          </div>
          <div className="text-xs text-slate-400">
            {stats?.totalLiveJobs ?? "—"} live jobs ·{" "}
            {stats?.totalClosingSoon ?? "—"} closing soon ·{" "}
            {stats?.totalDraftJobs ?? "—"} drafts pending review
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          <StatCard icon={Eye}            label="Page Views Today"       value={stats?.todayPageViews ?? 0}       color="blue"    loading={loading} />
          <StatCard icon={Users}          label="Unique Visitors Today"  value={stats?.todayUniqueVisitors ?? 0}  color="violet"  loading={loading} />
          <StatCard icon={DollarSign}     label="AdSense Today"          value={`₹${stats?.adsenseRevToday?.toFixed(0) ?? 0}`} color="emerald" loading={loading} sub={`₹${stats?.adsenseRevMonth?.toFixed(0) ?? 0} this month`} />
          <StatCard icon={MousePointerClick} label="Affiliate Clicks Today" value={stats?.affiliateClicksToday ?? 0} color="amber" loading={loading} sub={`₹${stats?.affiliateRevToday?.toFixed(0) ?? 0} revenue`} />
          <StatCard icon={TrendingUp}     label="Live Jobs"              value={stats?.totalLiveJobs ?? 0}        color="blue"    loading={loading} />
          <StatCard icon={AlertTriangle}  label="Closing Soon"           value={stats?.totalClosingSoon ?? 0}     color="amber"   loading={loading} />
          <StatCard icon={Bell}           label="Push Subscribers"       value={stats?.pushSubscribers ?? 0}      color="violet"  loading={loading} />
          <StatCard icon={Activity}       label="New Jobs Today"         value={stats?.newJobsToday ?? 0}         color="emerald" loading={loading} />
        </div>

        {/* ── TABS ── */}
        <div className="bg-[#1E293B] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex border-b border-white/10">
            {[
              { key: "drafts",   label: "Draft Jobs",      icon: FileText,  count: drafts.length },
              { key: "links",    label: "Dead Links",       icon: LinkIcon,  count: deadLinks.length },
              { key: "scrapers", label: "Scraper Health",   icon: Database,  count: scrapers.length },
            ].map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-blue-500 text-blue-400 bg-blue-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={14} />
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    key === "links" && count > 0
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/10 text-slate-300"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* DRAFTS TAB */}
          {activeTab === "drafts" && (
            <div className="overflow-x-auto">
              {drafts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle size={28} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-medium">No pending drafts</p>
                  <p className="text-sm mt-1">AI pipeline will deposit new jobs here</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      {["Job Title", "Department", "Vacancies", "Last Date", "AI Confidence", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((job) => {
                      const conf = job.aiParseConfidence ?? 0;
                      const confColor = conf >= 0.85 ? "text-emerald-400" : conf >= 0.7 ? "text-amber-400" : "text-red-400";
                      return (
                        <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="max-w-[280px]">
                              <p className="font-semibold text-white truncate">{job.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {timeAgo(job.createdAt)} · ID: {job.id.slice(-6)}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-xs truncate max-w-[160px]">
                            {job.department}
                          </td>
                          <td className="px-4 py-3 text-slate-200 font-bold tabular-nums">
                            {job.totalVacancies?.toLocaleString("en-IN") ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                            {job.applicationEndDate
                              ? new Date(job.applicationEndDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold tabular-nums ${confColor}`}>
                              {(conf * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/jobs/${job.id}/edit`}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                                title="Edit"
                              >
                                <Edit3 size={13} />
                              </a>
                              <button
                                onClick={() => handlePublish(job.id)}
                                disabled={publishingId === job.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                              >
                                {publishingId === job.id
                                  ? <><RefreshCw size={11} className="animate-spin" /> Publishing...</>
                                  : "Publish"}
                              </button>
                              <button
                                onClick={() => handleDelete(job.id)}
                                disabled={deletingId === job.id}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* DEAD LINKS TAB */}
          {activeTab === "links" && (
            <div className="overflow-x-auto">
              {deadLinks.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle size={28} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-medium">All external links are healthy</p>
                  <p className="text-sm mt-1">Sentinel checks every hour</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      {["Job", "Link Type", "URL", "HTTP Status", "Down Since", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deadLinks.map((link) => (
                      <tr key={link.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <a href={`/jobs/${link.jobSlug}`} className="text-blue-400 hover:underline text-xs font-medium max-w-[180px] block truncate">
                            {link.jobTitle}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-white/10 px-2 py-0.5 rounded font-mono text-slate-300">
                            {link.linkType}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <a href={link.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-blue-400 truncate block font-mono"
                            title={link.url}>
                            {link.url.slice(0, 40)}…
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded">
                            {link.httpStatus ?? "Timeout"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {timeAgo(link.downSince)}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/jobs/${link.jobSlug}/edit`}
                            className="text-xs text-blue-400 hover:underline font-medium"
                          >
                            Fix URL →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* SCRAPERS TAB */}
          {activeTab === "scrapers" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    {["Source", "Last Run", "Status", "Jobs Found", "Schedule", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scrapers.map((sc) => (
                    <tr key={sc.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!sc.isActive ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white text-sm">{sc.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{sc.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {timeAgo(sc.lastRunAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ScraperStatusBadge status={sc.lastStatus} />
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-bold tabular-nums">
                        {sc.jobsFoundLast}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                        {sc.cronSchedule}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRunScraper(sc.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded-lg transition-colors"
                            title="Run now"
                          >
                            <RefreshCw size={11} /> Run
                          </button>
                          <button
                            onClick={() => handleToggleScraper(sc.id, sc.isActive)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            title={sc.isActive ? "Disable" : "Enable"}
                          >
                            {sc.isActive
                              ? <ToggleRight size={16} className="text-emerald-400" />
                              : <ToggleLeft size={16} className="text-slate-500" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Job Manually",    href: "/jobs/new",          icon: Edit3,     color: "bg-blue-600" },
            { label: "All Jobs",            href: "/jobs",              icon: FileText,  color: "bg-slate-700" },
            { label: "Run All Scrapers",    href: "#",                  icon: RefreshCw, color: "bg-violet-600" },
            { label: "System Settings",     href: "/settings",          icon: Server,    color: "bg-slate-700" },
          ].map(({ label, href, icon: Icon, color }) => (
            <a
              key={label}
              href={href}
              className={`${color} hover:opacity-90 text-white font-semibold text-sm px-4 py-3 rounded-xl flex items-center gap-2 transition-opacity`}
            >
              <Icon size={15} /> {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
