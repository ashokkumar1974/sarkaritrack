// ============================================================
// SarkariTrack — JobsDataTable.tsx
// apps/web/src/components/jobs/JobsDataTable.tsx
//
// Features:
//  - TanStack Table v8 with client-side filtering & sorting
//  - Multi-select filters: State, Qualification, Department, Salary
//  - Fuzzy column search
//  - Reactive status badges (Apply Now / Closing Soon / Closed)
//  - Auto-pushes closed rows to bottom
//  - Sort by Vacancies or Pay Scale
// ============================================================

"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
} from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
  ExternalLink,
  FileText,
  Clock,
  Users,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { cn, formatIndianNumber, daysUntil } from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type JobStatus = "LIVE" | "CLOSING_SOON" | "CLOSED" | "ARCHIVED" | "RESULT_OUT" | "DRAFT";

export interface JobRow {
  id: string;
  slug: string;
  title: string;
  department: string;
  stateName: string | null;
  stateSlug: string | null;
  isNational: boolean;
  totalVacancies: number | null;
  payScaleMin: number | null;
  payScaleMax: number | null;
  payScaleText: string | null;
  applicationEndDate: string | null; // ISO string
  notificationDate: string | null;
  qualificationLabels: string[];     // ["10th Pass", "12th Pass"]
  status: JobStatus;
  applyOnlineUrl: string | null;
  notificationPdfUrl: string | null;
}

// ──────────────────────────────────────────────
// Status Badge Component
// ──────────────────────────────────────────────

function JobStatusBadge({ status, endDate }: { status: JobStatus; endDate: string | null }) {
  const days = endDate ? daysUntil(endDate) : null;

  if (status === "CLOSED" || status === "ARCHIVED") {
    return (
      <Badge
        variant="secondary"
        className="bg-gray-100 text-gray-500 border-gray-200 font-medium text-xs px-2 py-0.5"
      >
        Closed
      </Badge>
    );
  }

  if (status === "RESULT_OUT") {
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-xs px-2 py-0.5 border">
        Result Out
      </Badge>
    );
  }

  if (status === "CLOSING_SOON" || (days !== null && days <= 2 && days >= 0)) {
    const hoursLeft = days !== null ? Math.floor(days * 24) : null;
    return (
      <Badge className="relative bg-orange-50 text-orange-700 border-orange-300 font-semibold text-xs px-2 py-0.5 border animate-pulse">
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
        </span>
        {hoursLeft !== null && hoursLeft < 24
          ? `Closes in ${hoursLeft}h`
          : "Closing Soon"}
      </Badge>
    );
  }

  // LIVE — active registration
  return (
    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs px-2 py-0.5 border">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
      Apply Now
    </Badge>
  );
}

// ──────────────────────────────────────────────
// Fuzzy Filter Function (TanStack)
// ──────────────────────────────────────────────

const fuzzyFilter: FilterFn<JobRow> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value as string);
  addMeta({ itemRank });
  return itemRank.passed;
};

// ──────────────────────────────────────────────
// Sort utility: closed rows always sink to bottom
// ──────────────────────────────────────────────

function sortWithClosedLast(rows: JobRow[]): JobRow[] {
  const active: JobRow[] = [];
  const closed: JobRow[] = [];
  rows.forEach((r) =>
    r.status === "CLOSED" || r.status === "ARCHIVED" ? closed.push(r) : active.push(r)
  );
  return [...active, ...closed];
}

// ──────────────────────────────────────────────
// Column Definitions
// ──────────────────────────────────────────────

const columnHelper = createColumnHelper<JobRow>();

function buildColumns(): ColumnDef<JobRow, any>[] {
  return [
    columnHelper.accessor("title", {
      id: "title",
      header: "Recruitment / Post",
      filterFn: "fuzzy" as any,
      cell: ({ row }) => {
        const job = row.original;
        return (
          <div className="min-w-[220px] max-w-[340px]">
            <Link
              href={`/jobs/${job.slug}`}
              className="text-blue-700 hover:text-blue-900 font-semibold text-sm leading-snug hover:underline line-clamp-2"
            >
              {job.title}
            </Link>
            <p className="text-gray-500 text-xs mt-0.5 truncate">{job.department}</p>
            {job.stateName && (
              <Link
                href={`/state/${job.stateSlug}`}
                className="text-xs text-indigo-500 hover:underline mt-0.5 inline-block"
              >
                {job.stateName}
              </Link>
            )}
            {job.isNational && (
              <span className="text-xs text-purple-600 font-medium mt-0.5 inline-block">
                All India
              </span>
            )}
          </div>
        );
      },
    }),

    columnHelper.accessor("totalVacancies", {
      id: "totalVacancies",
      header: ({ column }) => (
        <SortableHeader column={column} icon={<Users size={13} />}>
          Vacancies
        </SortableHeader>
      ),
      cell: ({ getValue }) => {
        const v = getValue<number | null>();
        return v !== null ? (
          <span className="font-bold text-gray-800 tabular-nums">
            {formatIndianNumber(v)}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        );
      },
      sortUndefined: "last",
    }),

    columnHelper.accessor("payScaleMax", {
      id: "payScaleMax",
      header: ({ column }) => (
        <SortableHeader column={column} icon={<IndianRupee size={13} />}>
          Pay Scale
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const { payScaleText, payScaleMin, payScaleMax } = row.original;
        if (payScaleText) {
          return <span className="text-xs text-gray-700 whitespace-nowrap">{payScaleText}</span>;
        }
        if (payScaleMin && payScaleMax) {
          return (
            <span className="text-xs text-gray-700 whitespace-nowrap tabular-nums">
              ₹{formatIndianNumber(payScaleMin)} – ₹{formatIndianNumber(payScaleMax)}
            </span>
          );
        }
        return <span className="text-gray-400 text-xs">—</span>;
      },
      sortUndefined: "last",
    }),

    columnHelper.accessor("qualificationLabels", {
      id: "qualification",
      header: "Qualification",
      filterFn: (row, _, filterValue: string) => {
        if (!filterValue) return true;
        return row.original.qualificationLabels.some((q) =>
          q.toLowerCase().includes(filterValue.toLowerCase())
        );
      },
      cell: ({ getValue }) => {
        const quals = getValue<string[]>();
        return (
          <div className="flex flex-wrap gap-1 max-w-[160px]">
            {quals.slice(0, 3).map((q) => (
              <span
                key={q}
                className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium border border-indigo-100"
              >
                {q}
              </span>
            ))}
            {quals.length > 3 && (
              <span className="text-xs text-gray-400">+{quals.length - 3}</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    }),

    columnHelper.accessor("applicationEndDate", {
      id: "deadline",
      header: ({ column }) => (
        <SortableHeader column={column} icon={<Clock size={13} />}>
          Last Date
        </SortableHeader>
      ),
      cell: ({ getValue, row }) => {
        const d = getValue<string | null>();
        if (!d) return <span className="text-gray-400 text-xs">—</span>;
        const date = new Date(d);
        const days = daysUntil(d);
        const isUrgent = days !== null && days <= 5 && days >= 0;
        return (
          <div className="whitespace-nowrap">
            <span className={cn("text-xs font-medium", isUrgent ? "text-red-600" : "text-gray-700")}>
              {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            {days !== null && days >= 0 && (
              <p className={cn("text-xs", isUrgent ? "text-red-500 font-semibold" : "text-gray-400")}>
                {days === 0 ? "Today!" : `${days}d left`}
              </p>
            )}
          </div>
        );
      },
    }),

    columnHelper.accessor("status", {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <JobStatusBadge
          status={row.original.status}
          endDate={row.original.applicationEndDate}
        />
      ),
      enableColumnFilter: false,
    }),

    // Actions column
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const job = row.original;
        const isClosed = job.status === "CLOSED" || job.status === "ARCHIVED";
        return (
          <div className="flex gap-1.5 items-center">
            {job.applyOnlineUrl && !isClosed ? (
              <a
                href={job.applyOnlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
              >
                Apply <ExternalLink size={10} />
              </a>
            ) : (
              <span className="text-xs text-gray-400 px-2.5 py-1.5">Closed</span>
            )}
            {job.notificationPdfUrl && (
              <a
                href={job.notificationPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Download Notification PDF"
                className="inline-flex items-center p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              >
                <FileText size={14} />
              </a>
            )}
          </div>
        );
      },
    }),
  ];
}

// ──────────────────────────────────────────────
// Sortable Header Helper
// ──────────────────────────────────────────────

function SortableHeader({
  column,
  children,
  icon,
}: {
  column: any;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
    >
      {icon}
      {children}
      {sorted === "asc" ? (
        <ChevronUp size={13} className="text-blue-600" />
      ) : sorted === "desc" ? (
        <ChevronDown size={13} className="text-blue-600" />
      ) : (
        <ChevronsUpDown size={13} className="text-gray-400" />
      )}
    </button>
  );
}

// ──────────────────────────────────────────────
// Filter Bar Component
// ──────────────────────────────────────────────

interface FilterBarProps {
  globalFilter: string;
  onGlobalFilterChange: (v: string) => void;
  stateFilter: string;
  onStateFilter: (v: string) => void;
  qualFilter: string;
  onQualFilter: (v: string) => void;
  deptFilter: string;
  onDeptFilter: (v: string) => void;
  salaryFilter: string;
  onSalaryFilter: (v: string) => void;
  states: string[];
  qualifications: string[];
  departments: string[];
  totalRows: number;
  filteredRows: number;
  onClearAll: () => void;
}

function FilterBar({
  globalFilter, onGlobalFilterChange,
  stateFilter, onStateFilter,
  qualFilter, onQualFilter,
  deptFilter, onDeptFilter,
  salaryFilter, onSalaryFilter,
  states, qualifications, departments,
  totalRows, filteredRows, onClearAll,
}: FilterBarProps) {
  const hasActiveFilters = globalFilter || stateFilter || qualFilter || deptFilter || salaryFilter;

  return (
    <div className="space-y-3">
      {/* Global search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <Input
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          placeholder="Search across all jobs, departments, posts..."
          className="pl-9 h-10 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-100 text-sm"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        <SlidersHorizontal size={15} className="text-gray-400 shrink-0" />

        <Select value={stateFilter} onValueChange={onStateFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs border-gray-200">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All States</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={qualFilter} onValueChange={onQualFilter}>
          <SelectTrigger className="h-8 w-[150px] text-xs border-gray-200">
            <SelectValue placeholder="All Qualifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Qualifications</SelectItem>
            {qualifications.map((q) => (
              <SelectItem key={q} value={q}>{q}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deptFilter} onValueChange={onDeptFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs border-gray-200">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={salaryFilter} onValueChange={onSalaryFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs border-gray-200">
            <SelectValue placeholder="Any Salary" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Salary</SelectItem>
            <SelectItem value="10000-30000">₹10K – ₹30K</SelectItem>
            <SelectItem value="30000-60000">₹30K – ₹60K</SelectItem>
            <SelectItem value="60000-100000">₹60K – ₹1L</SelectItem>
            <SelectItem value="100000-999999">₹1L+</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
          >
            Clear All
          </Button>
        )}

        <span className="ml-auto text-xs text-gray-400 tabular-nums">
          {filteredRows === totalRows
            ? `${totalRows} jobs`
            : `${filteredRows} of ${totalRows} jobs`}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────

interface JobsDataTableProps {
  data: JobRow[];
  initialPageSize?: number;
}

export function JobsDataTable({ data, initialPageSize = 25 }: JobsDataTableProps) {
  // Filter state
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "deadline", desc: false },
  ]);
  const [stateFilter, setStateFilter] = useState("");
  const [qualFilter, setQualFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");

  // Derive filter option lists from data
  const { states, qualifications, departments } = useMemo(() => {
    const stSet = new Set<string>();
    const qSet = new Set<string>();
    const dSet = new Set<string>();
    data.forEach((j) => {
      if (j.stateName) stSet.add(j.stateName);
      j.qualificationLabels.forEach((q) => qSet.add(q));
      dSet.add(j.department);
    });
    return {
      states: Array.from(stSet).sort(),
      qualifications: Array.from(qSet).sort(),
      departments: Array.from(dSet).sort(),
    };
  }, [data]);

  // Apply custom filters → produce filteredData
  const filteredData = useMemo(() => {
    let rows = data;

    if (stateFilter) {
      rows = rows.filter(
        (r) => r.stateName === stateFilter || (stateFilter === "National" && r.isNational)
      );
    }
    if (qualFilter) {
      rows = rows.filter((r) =>
        r.qualificationLabels.some((q) => q.toLowerCase().includes(qualFilter.toLowerCase()))
      );
    }
    if (deptFilter) {
      rows = rows.filter((r) =>
        r.department.toLowerCase().includes(deptFilter.toLowerCase())
      );
    }
    if (salaryFilter) {
      const [minStr, maxStr] = salaryFilter.split("-");
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      rows = rows.filter((r) => {
        const salary = r.payScaleMax ?? r.payScaleMin;
        if (!salary) return false;
        return salary >= min && salary <= max;
      });
    }

    return sortWithClosedLast(rows);
  }, [data, stateFilter, qualFilter, deptFilter, salaryFilter]);

  const columns = useMemo(() => buildColumns(), []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: initialPageSize } },
    filterFns: { fuzzy: fuzzyFilter },
  });

  const handleClearAll = useCallback(() => {
    setGlobalFilter("");
    setStateFilter("");
    setQualFilter("");
    setDeptFilter("");
    setSalaryFilter("");
  }, []);

  const { rows } = table.getRowModel();

  return (
    <div className="space-y-4">
      <FilterBar
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        stateFilter={stateFilter}
        onStateFilter={setStateFilter}
        qualFilter={qualFilter}
        onQualFilter={setQualFilter}
        deptFilter={deptFilter}
        onDeptFilter={setDeptFilter}
        salaryFilter={salaryFilter}
        onSalaryFilter={setSalaryFilter}
        states={states}
        qualifications={qualifications}
        departments={departments}
        totalRows={filteredData.length}
        filteredRows={rows.length}
        onClearAll={handleClearAll}
      />

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-gray-50 border-b border-gray-200">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-16 text-gray-400">
                    <Search size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No jobs match your filters</p>
                    <p className="text-xs mt-1">Try adjusting or clearing your filters</p>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const isClosed =
                    row.original.status === "CLOSED" ||
                    row.original.status === "ARCHIVED";
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-gray-100 transition-colors",
                        isClosed
                          ? "bg-gray-50/70 opacity-60"
                          : idx % 2 === 0
                          ? "bg-white hover:bg-blue-50/30"
                          : "bg-gray-50/40 hover:bg-blue-50/30"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 align-top">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 text-xs px-3"
            >
              ← Prev
            </Button>
            <span className="text-xs text-gray-500 tabular-nums">
              Page{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 text-xs px-3"
            >
              Next →
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Rows per page</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-7 w-16 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Utility: apps/web/src/lib/utils.ts
// ──────────────────────────────────────────────
/*
export function daysUntil(isoDate: string): number | null {
  const end = new Date(isoDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatIndianNumber(n: number): string {
  return n.toLocaleString("en-IN");
}
*/
