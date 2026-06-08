"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function ReportFilter({ 
  currentFilter, 
  currentStart, 
  currentEnd 
}: { 
  currentFilter: string;
  currentStart: string;
  currentEnd: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState(currentFilter);
  const [start, setStart] = useState(currentStart);
  const [end, setEnd] = useState(currentEnd);

  // When props change (e.g. from URL), update local state
  useEffect(() => {
    setFilter(currentFilter);
    setStart(currentStart);
    setEnd(currentEnd);
  }, [currentFilter, currentStart, currentEnd]);

  function applyFilter() {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("dateFilter", filter);
    if (filter === "custom") {
      if (start) params.set("start", start);
      if (end) params.set("end", end);
    }
    router.push(`/dashboard/reports?${params.toString()}`);
  }

  function reset() {
    setFilter("all");
    setStart("");
    setEnd("");
    router.push(`/dashboard/reports`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Date Range</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500"
        >
          <option value="all">Financial Year (FY)</option>
          <option value="this_month">This Month</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="custom">Custom Date</option>
        </select>
      </div>

      {filter === "custom" && (
        <>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">End Date</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </>
      )}

      <div className="flex gap-2">
        <button
          onClick={applyFilter}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition"
        >
          Apply Filter
        </button>
        {(filter !== "all" || start || end) && (
          <button
            onClick={reset}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
