"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PurchaseFilter({
  currentDateFilter,
  currentStart,
  currentEnd,
  currentSupplier,
  currentMode,
  parties,
}: {
  currentDateFilter: string;
  currentStart: string;
  currentEnd: string;
  currentSupplier: string;
  currentMode: string;
  parties: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState(currentDateFilter || "all");
  const [start, setStart] = useState(currentStart);
  const [end, setEnd] = useState(currentEnd);
  const [supplier, setSupplier] = useState(currentSupplier || "all");
  const [mode, setMode] = useState(currentMode || "all");

  const apply = () => {
    let q = `?dateFilter=${dateFilter}`;
    if (dateFilter === "custom") {
      q += `&start=${start}&end=${end}`;
    }
    if (supplier !== "all") q += `&supplier=${supplier}`;
    if (mode !== "all") q += `&mode=${mode}`;
    router.push(`/dashboard/purchases${q}`);
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
        <label className="mb-1 block text-xs font-semibold text-slate-500">Supplier</label>
        <select
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="max-w-[150px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="all">All Suppliers</option>
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
  );
}
