"use client";

import { DownloadCloud } from "lucide-react";

export function DataExportCard() {
  const downloadCsv = (type: string) => {
    window.location.href = `/api/export/${type}`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl">📥</div>
      <h4 className="mt-3 text-sm font-bold text-slate-900">Export Data (CSV)</h4>
      <p className="mt-1 text-xs text-slate-600">Download raw data for Excel/Tally.</p>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => downloadCsv('invoices')} className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
          <DownloadCloud size={14} /> Invoices
        </button>
        <button onClick={() => downloadCsv('inventory')} className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
          <DownloadCloud size={14} /> Inventory
        </button>
        <button onClick={() => downloadCsv('khata')} className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
          <DownloadCloud size={14} /> Parties
        </button>
      </div>
    </div>
  );
}
