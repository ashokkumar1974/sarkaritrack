"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface JobFilters {
  q: string; state: string; qualification: string;
  department: string; salary: string; type: string;
}

export function useJobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters: JobFilters = useMemo(() => ({
    q:             searchParams.get("q")             ?? "",
    state:         searchParams.get("state")         ?? "",
    qualification: searchParams.get("qualification") ?? "",
    department:    searchParams.get("department")    ?? "",
    salary:        searchParams.get("salary")        ?? "",
    type:          searchParams.get("type")          ?? "",
  }), [searchParams]);

  const setFilter = useCallback((key: keyof JobFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  return { filters, setFilter, clearAll, hasActiveFilters };
}
