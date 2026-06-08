"use client";

import { Download } from "lucide-react";

export function BackupRestoreCard() {
  const downloadReport = (type: string) => {
    // We will route to a dedicated print page for each type
    window.open(`/dashboard/reports/print?type=${type}`, '_blank');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl">💾</div>
      <h4 className="mt-3 text-sm font-bold text-slate-900">Backup & Restore</h4>
      <p className="mt-1 text-xs text-slate-600">Download PDF reports of your data.</p>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => downloadReport('inventory')} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <Download size={14} /> Inventory
        </button>
        <button onClick={() => downloadReport('khata')} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <Download size={14} /> Khata
        </button>
        <button onClick={() => downloadReport('parties')} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <Download size={14} /> Parties
        </button>
        <button onClick={() => downloadReport('gst')} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <Download size={14} /> GST Report
        </button>
      </div>
    </div>
  );
}
