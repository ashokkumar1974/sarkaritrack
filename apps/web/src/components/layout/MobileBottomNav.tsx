// ============================================================
// apps/admin/src/app/scrapers/page.tsx
// Full Scraper Management Page
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw, ToggleLeft, ToggleRight, Activity,
  CheckCircle, XCircle, AlertTriangle, Clock,
  ChevronDown, ChevronUp, ArrowLeft,
} from "lucide-react";

interface ScraperRun {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  jobsFound: number;
  jobsCreated: number;
  jobsSkipped: number;
  pdfsParsed: number;
  errorLog: string | null;
}

interface Scraper {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  scraperClass: string;
  isActive: boolean;
  cronSchedule: string;
  lastRunAt: string | null;
  lastStatus: string | null;
  jobsFoundLast: number;
  recentRuns?: ScraperRun[];
}

const STATUS_MAP: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
  SUCCESS: { icon: CheckCircle,   cls: "text-emerald-400", label: "Success"  },
  PARTIAL: { icon: AlertTriangle, cls: "text-amber-400",   label: "Partial"  },
  FAILED:  { icon: XCircle,       cls: "text-red-400",     label: "Failed"   },
  RUNNING: { icon: RefreshCw,     cls: "text-blue-400",    label: "Running"  },
  SKIPPED: { icon: Clock,         cls: "text-slate-500",   label: "Skipped"  },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ScrapersPage() {
  const [scrapers, setScrapers]     = useState<Scraper[]>([]);
  const [loading, setLoading]       = useState(true);
  const [running, setRunning]       = useState<Set<string>>(new Set());
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [runHistory, setRunHistory] = useState<Record<string, ScraperRun[]>>({});

  const fetchScrapers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/scrapers");
      const d = await r.json();
      setScrapers(d.scrapers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScrapers(); }, [fetchScrapers]);

  const handleRun = async (id: string, slug: string) => {
    setRunning((prev) => new Set([...prev, id]));
    setScrapers((prev) => prev.map((s) =>
      s.id === id ? { ...s, lastStatus: "RUNNING" } : s
    ));
    try {
      await fetch(`/api/admin/scrapers/${id}/run`, { method: "POST" });
      setTimeout(() => {
        setRunning((prev) => { const n = new Set(prev); n.delete(id); return n; });
        fetchScrapers();
      }, 5000);
    } catch {
      setRunning((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/scrapers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setScrapers((prev) => prev.map((s) =>
      s.id === id ? { ...s, isActive: !isActive } : s
    ));
  };

  const toggleExpand = async (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      if (!runHistory[id]) {
        try {
          const r = await fetch(`/api/admin/scrapers/${id}/runs`);
          const d = await r.json();
          setRunHistory((prev) => ({ ...prev, [id]: d.runs ?? [] }));
        } catch { /* ignore */ }
      }
    }
    setExpanded(next);
  };

  const handleRunAll = async () => {
    for (const s of scrapers.filter((s) => s.isActive)) {
      await handleRun(s.id, s.slug);
      await new Promise((r) => setTimeout(r, 2000));
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0F172A] z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <span className="text-white/20">/</span>
          <h1 className="text-base font-bold flex items-center gap-2">
            <Activity size={15} className="text-blue-400" /> Scraper Management
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchScrapers}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
          </button>
          <button
            onClick={handleRunAll}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Run All Active
          </button>
        </div>
      </header>

      <div className="p-6 space-y-3">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Scrapers",  value: scrapers.length },
            { label: "Active",          value: scrapers.filter((s) => s.isActive).length },
            { label: "Last 24h Success",value: scrapers.filter((s) => s.lastStatus === "SUCCESS").length },
            { label: "Failed / Error",  value: scrapers.filter((s) => s.lastStatus === "FAILED").length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#1E293B] border border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className="text-2xl font-extrabold text-white tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Scraper list */}
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#1E293B] border border-white/10 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-40 mb-2" />
              <div className="h-3 bg-white/5 rounded w-64" />
            </div>
          ))
        ) : (
          scrapers.map((sc) => {
            const st = STATUS_MAP[sc.lastStatus ?? ""] ?? STATUS_MAP.SKIPPED;
            const StatusIcon = st.icon;
            const isExpanded = expanded.has(sc.id);
            const isRunning  = running.has(sc.id) || sc.lastStatus === "RUNNING";

            return (
              <div
                key={sc.id}
                className={`bg-[#1E293B] border rounded-xl overflow-hidden transition-colors ${
                  sc.isActive ? "border-white/10" : "border-white/5 opacity-60"
                }`}
              >
                {/* Main row */}
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-white text-sm">{sc.name}</p>
                      {!sc.isActive && (
                        <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">Disabled</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="font-mono">{sc.slug}</span>
                      <span>·</span>
                      <span>{sc.cronSchedule}</span>
                      <span>·</span>
                      <a href={sc.baseUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:underline truncate max-w-[200px]">
                        {sc.baseUrl}
                      </a>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-center shrink-0">
                    <div>
                      <p className="text-lg font-extrabold text-white tabular-nums">{sc.jobsFoundLast}</p>
                      <p className="text-xs text-slate-500">Last run</p>
                    </div>
                    <div>
                      <div className={`flex items-center gap-1 ${st.cls}`}>
                        <StatusIcon size={14} className={isRunning ? "animate-spin" : ""} />
                        <span className="text-xs font-semibold">{st.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{timeAgo(sc.lastRunAt)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRun(sc.id, sc.slug)}
                      disabled={isRunning || !sc.isActive}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 disabled:opacity-40 text-blue-400 text-xs font-bold rounded-lg transition-colors"
                    >
                      <RefreshCw size={11} className={isRunning ? "animate-spin" : ""} />
                      {isRunning ? "Running…" : "Run Now"}
                    </button>
                    <button
                      onClick={() => handleToggle(sc.id, sc.isActive)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title={sc.isActive ? "Disable scraper" : "Enable scraper"}
                    >
                      {sc.isActive
                        ? <ToggleRight size={18} className="text-emerald-400" />
                        : <ToggleLeft size={18} className="text-slate-500" />}
                    </button>
                    <button
                      onClick={() => toggleExpand(sc.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded run history */}
                {isExpanded && (
                  <div className="border-t border-white/10 px-5 py-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                      Recent Run History
                    </p>
                    {!runHistory[sc.id] ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw size={16} className="text-slate-500 animate-spin" />
                      </div>
                    ) : runHistory[sc.id].length === 0 ? (
                      <p className="text-xs text-slate-500">No runs yet</p>
                    ) : (
                      <div className="space-y-2">
                        {runHistory[sc.id].slice(0, 8).map((run) => {
                          const rs = STATUS_MAP[run.status] ?? STATUS_MAP.SKIPPED;
                          const RIcon = rs.icon;
                          return (
                            <div key={run.id} className="flex items-center gap-3 text-xs">
                              <RIcon size={12} className={rs.cls} />
                              <span className="text-slate-300 tabular-nums w-20 shrink-0">
                                {new Date(run.startedAt).toLocaleDateString("en-IN", {
                                  day: "2-digit", month: "short",
                                })}
                              </span>
                              <span className="text-slate-400">
                                Found: <strong className="text-white">{run.jobsFound}</strong>
                              </span>
                              <span className="text-slate-400">
                                New: <strong className="text-emerald-400">{run.jobsCreated}</strong>
                              </span>
                              <span className="text-slate-400">
                                PDFs: <strong className="text-blue-400">{run.pdfsParsed}</strong>
                              </span>
                              {run.errorLog && (
                                <span className="text-red-400 truncate max-w-[200px]" title={run.errorLog}>
                                  ⚠ {run.errorLog.slice(0, 40)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


// ============================================================
// apps/web/src/components/layout/MobileBottomNav.tsx
// Sticky bottom nav for mobile users
// ============================================================
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, CreditCard, Zap, Search } from "lucide-react";

const NAV_ITEMS = [
  { icon: Home,       label: "Home",      href: "/"            },
  { icon: Trophy,     label: "Results",   href: "/results"     },
  { icon: Search,     label: "Search",    href: "/search"      },
  { icon: CreditCard, label: "Admit",     href: "/admit-cards" },
  { icon: Zap,        label: "Tools",     href: "/tools"       },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden pb-safe">
      <div className="flex">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-center transition-colors ${
                active ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? "text-blue-600" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
