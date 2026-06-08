"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HistoryFilter({
  currentFilter,
  currentStart,
  currentEnd,
}: {
  currentFilter: string;
  currentStart: string;
  currentEnd: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState(currentFilter);
  const [start, setStart] = useState(currentStart);
  const [end, setEnd] = useState(currentEnd);

  const apply = () => {
    let q = `?filter=${filter}`;
    if (filter === "custom") {
      q += `&start=${start}&end=${end}`;
    }
    router.push(`/dashboard/history${q}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Date Filter</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="custom">Custom Date Range</option>
        </select>
      </div>
      
      {filter === "custom" && (
        <>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Start Date</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">End Date</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500"
            />
          </div>
        </>
      )}

      <button
        onClick={apply}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
      >
        Apply
      </button>
    </div>
  );
}
