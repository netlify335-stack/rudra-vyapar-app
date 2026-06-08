"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvoiceFilter({
  currentQ,
  currentDateFilter,
  currentStart,
  currentEnd,
  currentCustomer,
  currentMode,
  parties,
}: {
  currentQ: string;
  currentDateFilter: string;
  currentStart: string;
  currentEnd: string;
  currentCustomer: string;
  currentMode: string;
  parties: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ || "");
  const [dateFilter, setDateFilter] = useState(currentDateFilter || "all");
  const [start, setStart] = useState(currentStart);
  const [end, setEnd] = useState(currentEnd);
  const [customer, setCustomer] = useState(currentCustomer || "all");
  const [mode, setMode] = useState(currentMode || "all");

  const apply = () => {
    let query = `?dateFilter=${dateFilter}`;
    if (q.trim()) query += `&q=${encodeURIComponent(q.trim())}`;
    if (dateFilter === "custom") {
      q += `&start=${start}&end=${end}`;
    }
    }
    if (customer !== "all") query += `&customer=${customer}`;
    if (mode !== "all") query += `&mode=${mode}`;
    router.push(`/dashboard/invoices${query}`);
  };

  return (
    <div className="mb-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative max-w-md">
        <input
          placeholder="Search by customer or bill no..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-orange-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") apply();
          }}
        />
      </div>
      <div className="flex flex-wrap items-end gap-4">
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
        <label className="mb-1 block text-xs font-semibold text-slate-500">Customer</label>
        <select
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="max-w-[150px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="all">All Customers</option>
          <option value="walkin">Walk-in Customer</option>
          {parties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Payment Mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="all">All Modes</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="credit">Udhaar (Credit)</option>
        </select>
      </div>

        <button
          onClick={apply}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
}
