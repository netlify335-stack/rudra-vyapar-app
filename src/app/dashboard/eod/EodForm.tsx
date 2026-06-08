"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";

export function EodForm({
  todayStr,
  netCashFlow,
  netUpiFlow,
}: {
  todayStr: string;
  netCashFlow: number;
  netUpiFlow: number;
}) {
  const [openingBalance, setOpeningBalance] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [actualUpi, setActualUpi] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const openBal = Number(openingBalance) || 0;
  const expectedCash = openBal + netCashFlow;
  const expectedUpi = netUpiFlow; // usually UPI doesn't have an opening balance

  const actCash = Number(actualCash) || 0;
  const actUpi = Number(actualUpi) || 0;

  const cashDiscrepancy = actCash - expectedCash;
  const upiDiscrepancy = actUpi - expectedUpi;
  const totalDiscrepancy = cashDiscrepancy + upiDiscrepancy;

  async function handleSubmit() {
    if (!confirm(`Are you sure you want to finalize EOD for ${todayStr}?`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/eod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: todayStr,
          openingBalance: openBal,
          expectedCash,
          actualCash: actCash,
          expectedUpi,
          actualUpi: actUpi,
          discrepancy: totalDiscrepancy,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setDone(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
        <h2 className="text-xl font-bold text-emerald-900">EOD Reconciled Successfully!</h2>
        <p className="mt-2 text-sm text-emerald-700">The day's register has been closed.</p>
        <button onClick={() => window.location.reload()} className="mt-6 font-bold text-emerald-600 hover:text-emerald-700">Refresh Page</button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Drawer Calculation Card */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Drawer Calculation (System)</h3>
        
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Morning Opening Balance (Cash)</label>
          <input
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-lg font-bold outline-none focus:border-indigo-500 focus:bg-white"
            placeholder="₹ 0.00"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <div className="text-xs font-semibold text-slate-500">Net Cash Flow Today</div>
            <div className={`text-lg font-bold ${netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatINR(netCashFlow)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Net UPI Flow Today</div>
            <div className={`text-lg font-bold ${netUpiFlow >= 0 ? "text-indigo-600" : "text-rose-600"}`}>{formatINR(netUpiFlow)}</div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between text-sm font-bold text-slate-700">
            <span>Expected Cash in Drawer:</span>
            <span>{formatINR(expectedCash)}</span>
          </div>
          <div className="flex justify-between mt-1 text-sm font-bold text-slate-700">
            <span>Expected UPI Receipts:</span>
            <span>{formatINR(expectedUpi)}</span>
          </div>
        </div>
      </div>

      {/* Actual Physical Count Card */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-lg">
        <h3 className="text-lg font-bold">Physical Count</h3>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Actual Cash in Drawer</label>
          <input
            type="number"
            value={actualCash}
            onChange={(e) => setActualCash(e.target.value)}
            className="w-full rounded-xl border-none bg-slate-800 px-4 py-3 text-2xl font-bold text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
            placeholder="₹ 0.00"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Actual UPI Settled in Bank</label>
          <input
            type="number"
            value={actualUpi}
            onChange={(e) => setActualUpi(e.target.value)}
            className="w-full rounded-xl border-none bg-slate-800 px-4 py-3 text-2xl font-bold text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
            placeholder="₹ 0.00"
          />
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Discrepancy (Cash):</span>
            <span className={`font-bold ${cashDiscrepancy === 0 ? "text-emerald-400" : cashDiscrepancy > 0 ? "text-amber-400" : "text-rose-400"}`}>
              {formatINR(cashDiscrepancy)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-400">Discrepancy (UPI):</span>
            <span className={`font-bold ${upiDiscrepancy === 0 ? "text-emerald-400" : upiDiscrepancy > 0 ? "text-amber-400" : "text-rose-400"}`}>
              {formatINR(upiDiscrepancy)}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Notes (If discrepancy)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border-none bg-slate-800 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
            placeholder="Explain difference..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || (!actualCash && !actualUpi)}
          className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-3 text-base font-bold shadow-md hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading ? "Reconciling..." : "Save EOD Report"}
        </button>
      </div>
    </div>
  );
}
