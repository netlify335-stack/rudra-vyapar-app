"use client";

import Link from "next/link";
import { useState } from "react";
import { Settings, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function TopBar({
  currentStoreId,
  storeName,
  location,
  alerts,
  allStores,
}: {
  currentStoreId?: string;
  storeName: string;
  location: string;
  alerts: { lowStock: number; expiring: number; udhaar: number };
  allStores?: { id: string; name: string; location: string | null }[];
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStoreSwitcher, setShowStoreSwitcher] = useState(false);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();

  const totalAlerts = alerts.lowStock + alerts.expiring + alerts.udhaar;

  const handleSwitch = async (id: string) => {
    if (id === currentStoreId) return;
    setSwitching(true);
    const res = await fetch("/api/auth/switch-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: id }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setSwitching(false);
      alert("Failed to switch store");
    }
  };

  const createNewBranch = async () => {
    const name = prompt("Enter new branch name (e.g. 'Delhi Branch'):");
    if (!name) return;
    setSwitching(true);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      await handleSwitch(data.storeId);
    } else {
      setSwitching(false);
      alert("Failed to create new branch");
    }
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="flex items-center justify-between gap-4 px-5 py-3 md:px-8">
        <div className="relative flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm md:hidden">
            S
          </div>
          <button 
            disabled={switching}
            onClick={() => setShowStoreSwitcher(!showStoreSwitcher)} 
            className="flex min-w-0 items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
          >
            <div className="text-left">
              <div className="truncate text-sm font-bold text-slate-900 dark:text-white">{switching ? "Switching..." : storeName}</div>
              <div className="flex items-center gap-2 truncate text-[11px] text-slate-500 dark:text-slate-400">
                <span>{location}</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showStoreSwitcher && allStores && (
            <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-[9999] transition-colors">
              <div className="px-2 py-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Your Branches</div>
              <div className="max-h-[60vh] overflow-y-auto">
                {allStores.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => handleSwitch(s.id)}
                    className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                      s.id === currentStoreId 
                        ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" 
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div>{s.name}</div>
                      {s.location && <div className="text-[10px] font-normal text-slate-500 dark:text-slate-500">{s.location}</div>}
                    </div>
                    {s.id === currentStoreId && <span className="text-orange-600 dark:text-orange-400">✓</span>}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
                <button 
                  onClick={createNewBranch}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add New Branch
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/billing"
            className="hidden rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-200/60 hover:scale-[1.02] md:inline-flex"
          >
            + New Sale
          </Link>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" 
              aria-label="Notifications"
            >
              🔔
              {totalAlerts > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {totalAlerts}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="px-2 py-2 text-xs font-bold uppercase text-slate-500 flex justify-between items-center">
                  <span>Alerts & AI Tips</span>
                </div>
                
                <Link href="/dashboard" className="block rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 mb-2 hover:bg-indigo-50">
                  <div className="flex items-start gap-2">
                    <span className="text-base">✨</span>
                    <div>
                      <div className="text-[13px] font-bold text-indigo-700">Rudra AI Tip</div>
                      <div className="mt-0.5 text-xs font-medium text-slate-600">Click to generate full AI insights for your store on the dashboard.</div>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/inventory" className="block rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div className="text-sm font-semibold text-slate-900">{alerts.lowStock} Low Stock</div>
                  <div className="text-xs text-slate-500">Items below minimum level</div>
                </Link>
                <Link href="/dashboard/inventory" className="block rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div className="text-sm font-semibold text-slate-900">{alerts.expiring} Expiring Soon</div>
                  <div className="text-xs text-slate-500">Batches expiring in &lt; 10 days</div>
                </Link>
                <Link href="/dashboard/khata" className="block rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div className="text-sm font-semibold text-slate-900">{alerts.udhaar} Udhaar</div>
                  <div className="text-xs text-slate-500">Customers with pending dues</div>
                </Link>
              </div>
            )}
          </div>

          <Link href="/dashboard/settings" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
            <Settings size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
