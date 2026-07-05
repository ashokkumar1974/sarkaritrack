// ============================================================
// apps/web/src/components/home/HeroSearch.tsx
// Predictive search bar with debounced API calls
// ============================================================
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp } from "lucide-react";

interface SearchSuggestion {
  slug: string;
  title: string;
  department: string;
  postType: string;
}

const TRENDING = [
  "SSC CGL 2025", "UPSC Civil Services", "Railway Group D",
  "IBPS PO", "UP Police Constable", "BPSC 70th",
];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/jobs/${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      handleSelect(suggestions[activeIdx].slug);
    } else {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === "Escape") { setIsOpen(false); inputRef.current?.blur(); }
  };

  const postTypeBadge = (t: string) => {
    const map: Record<string, string> = {
      ONLINE_FORM: "Form", ADMIT_CARD: "Admit Card",
      RESULT: "Result", SYLLABUS: "Syllabus",
    };
    return map[t] ?? t;
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setActiveIdx(-1); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search jobs, results, admit cards..."
          autoComplete="off"
          className="w-full h-14 pl-11 pr-24 rounded-xl bg-white text-gray-900 text-base font-medium placeholder:text-gray-400 border-0 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Search government jobs"
          aria-autocomplete="list"
          aria-expanded={isOpen && (suggestions.length > 0 || query.length === 0)}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 h-10 rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {query.length < 2 ? (
            <div className="p-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1">
                <TrendingUp size={12} /> Trending searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setQuery(t); fetchSuggestions(t); }}
                    className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-2.5 py-1 rounded-md font-medium transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              No results for "<strong>{query}</strong>"
            </div>
          ) : (
            <ul role="listbox">
              {suggestions.map((s, idx) => (
                <li key={s.slug} role="option" aria-selected={idx === activeIdx}>
                  <button
                    onClick={() => handleSelect(s.slug)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                      idx === activeIdx ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.title}</p>
                      <p className="text-xs text-gray-400 truncate">{s.department}</p>
                    </div>
                    <span className="shrink-0 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded font-medium">
                      {postTypeBadge(s.postType)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Click-outside close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden />
      )}
    </div>
  );
}


// ============================================================
// apps/web/src/components/home/MasterMatrix.tsx
// 4-column hub: Forms | Admit Cards | Results | Syllabus
// ============================================================
import Link from "next/link";
import { FileText, CreditCard, Trophy, BookOpen, ChevronRight } from "lucide-react";

interface MatrixJob {
  id: string;
  slug: string;
  title: string;
  department: string;
  status: string;
  applicationEndDate?: Date | null;
  admitCardDate?: Date | null;
  resultDate?: Date | null;
  postType?: string;
  totalVacancies?: number | null;
  state?: { name: string; slug: string } | null;
}

interface MasterMatrixProps {
  latestForms: MatrixJob[];
  admitCards: MatrixJob[];
  results: MatrixJob[];
  syllabi: MatrixJob[];
}

const COLUMNS = [
  {
    key: "forms",
    label: "Latest Online Forms",
    icon: FileText,
    color: "blue",
    viewAllHref: "/jobs?type=online-form",
    dateKey: "applicationEndDate" as const,
    dateLabel: "Last date",
  },
  {
    key: "admitCards",
    label: "Admit Cards",
    icon: CreditCard,
    color: "violet",
    viewAllHref: "/admit-cards",
    dateKey: "admitCardDate" as const,
    dateLabel: "Available",
  },
  {
    key: "results",
    label: "Exam Results",
    icon: Trophy,
    color: "emerald",
    viewAllHref: "/results",
    dateKey: "resultDate" as const,
    dateLabel: "Declared",
  },
  {
    key: "syllabi",
    label: "Syllabus / Answer Keys",
    icon: BookOpen,
    color: "amber",
    viewAllHref: "/jobs?type=syllabus",
    dateKey: null,
    dateLabel: null,
  },
] as const;

const colorMap = {
  blue:    { header: "bg-blue-600",   badge: "bg-blue-50 text-blue-700 border-blue-100",   dot: "bg-blue-500" },
  violet:  { header: "bg-violet-600", badge: "bg-violet-50 text-violet-700 border-violet-100", dot: "bg-violet-500" },
  emerald: { header: "bg-emerald-600",badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  amber:   { header: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
};

function MatrixItem({ job, dateKey, dateLabel, color }: {
  job: MatrixJob;
  dateKey: typeof COLUMNS[number]["dateKey"];
  dateLabel: string | null;
  color: keyof typeof colorMap;
}) {
  const c = colorMap[color];
  const rawDate = dateKey ? (job as any)[dateKey] : null;
  const dateStr = rawDate
    ? new Date(rawDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : null;

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group flex items-start gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
    >
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 leading-snug line-clamp-2 transition-colors">
          {job.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-gray-400 truncate max-w-[130px]">{job.department}</span>
          {dateStr && dateLabel && (
            <span className={`text-xs border px-1.5 py-0.5 rounded font-medium ${c.badge}`}>
              {dateLabel}: {dateStr}
            </span>
          )}
          {job.totalVacancies && (
            <span className="text-xs text-gray-400">{job.totalVacancies.toLocaleString("en-IN")} posts</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function MasterMatrix({ latestForms, admitCards, results, syllabi }: MasterMatrixProps) {
  const dataMap = { forms: latestForms, admitCards, results, syllabi };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const items = dataMap[col.key as keyof typeof dataMap] as MatrixJob[];
        const c = colorMap[col.color];
        const Icon = col.icon;
        return (
          <div key={col.key} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* Column header */}
            <div className={`${c.header} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Icon size={15} className="text-white/90" />
                <h2 className="text-sm font-bold text-white tracking-tight">{col.label}</h2>
              </div>
              <Link
                href={col.viewAllHref}
                className="text-xs text-white/70 hover:text-white flex items-center gap-0.5 transition-colors"
              >
                All <ChevronRight size={12} />
              </Link>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto max-h-[400px] divide-y-0">
              {items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nothing new yet</p>
              ) : (
                items.map((job) => (
                  <MatrixItem
                    key={job.id}
                    job={job}
                    dateKey={col.dateKey}
                    dateLabel={col.dateLabel}
                    color={col.color}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2.5">
              <Link
                href={col.viewAllHref}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                View all {col.label} <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ============================================================
// apps/web/src/components/home/MatrixSkeleton.tsx
// Loading skeleton for 4-column matrix
// ============================================================
export function MatrixSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-11 bg-gray-300 animate-pulse" />
          <div className="p-3 space-y-3">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-full" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


// ============================================================
// apps/web/src/components/layout/BreakingNewsBanner.tsx
// Scrolling breaking news strip
// ============================================================
"use client";
import { useState } from "react";
import { X, Zap } from "lucide-react";

export function BreakingNewsBanner({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="bg-red-600 text-white text-sm font-medium flex items-center gap-3 px-4 py-2.5 relative overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0 z-10">
        <Zap size={14} className="text-yellow-300" />
        <span className="font-bold uppercase tracking-wider text-xs text-yellow-200">Breaking</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="whitespace-nowrap animate-[marquee_30s_linear_infinite] inline-block">
          {message}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 hover:bg-white/20 rounded z-10"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
