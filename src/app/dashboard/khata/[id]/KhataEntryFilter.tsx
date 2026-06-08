"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function KhataEntryFilter({
  partyId,
  currentDateFilter,
  currentStart,
  currentEnd,
  currentType,
}: {
  partyId: string;
  currentDateFilter: string;
  currentStart: string;
  currentEnd: string;
  currentType: string;
}) {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState(currentDateFilter || "all");
  const [start, setStart] = useState(currentStart);
  const [end, setEnd] = useState(currentEnd);
  const [type, setType] = useState(currentType || "all");

  const apply = () => {
    let q = `?dateFilter=${dateFilter}`;
    if (dateFilter === "custom") {
      q += `&start=${start}&end=${end}`;
    }
    if (type !== "all") q += `&type=${type}`;
    router.push(`/dashboard/khata/${partyId}${q}`);
  };

  return (
    <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Date</label>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="custom">Custom Date Range</option>
        </select>
      </div>

      {dateFilter === "custom" && (
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

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Entry Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="all">All Entries</option>
          <option value="udhari">You Gave (Udhaar)</option>
          <option value="paid">You Got (Paid)</option>
        </select>
      </div>

      <button
        onClick={apply}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
      >
        Apply Filter
      </button>
    </div>
  );
}
