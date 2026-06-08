"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string; icon: string; badge?: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/hq", label: "HQ Overview", icon: "🏢" },
  { href: "/dashboard/history", label: "History", icon: "🕒" },
  { href: "/dashboard/billing", label: "Billing / POS", icon: "🧾" },
  { href: "/dashboard/invoices", label: "Sales Invoices", icon: "📄" },
  { href: "/dashboard/purchases", label: "Purchases", icon: "🛒" },
  { href: "/dashboard/khata", label: "Khata", icon: "📒" },
  { href: "/dashboard/parties", label: "Parties", icon: "👥" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "💸" },
  { href: "/dashboard/eod", label: "EOD Register", icon: "🌙" },
  { href: "/dashboard/reports", label: "Reports & GST", icon: "📊" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ alerts }: { alerts: { lowStock: number; expiring: number; udhaar: number } }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 md:flex md:flex-col transition-colors">
      <Link href="/" className="flex items-center gap-2 px-5 py-5 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md">
          <span className="font-bold">V</span>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">VyaparOne</div>
          <div className="-mt-0.5 text-[10px] font-semibold tracking-wide text-orange-600 dark:text-orange-400">CREATED BY RUDRA</div>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3">
        {NAV.map((n) => {
          const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href));
          let badge: string | null = null;
          if (n.href === "/dashboard/inventory" && alerts.lowStock) badge = String(alerts.lowStock);
          if (n.href === "/dashboard/khata" && alerts.udhaar) badge = String(alerts.udhaar);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition mb-0.5 ${
                active
                  ? "bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-900/40 dark:to-rose-900/40 text-orange-700 dark:text-orange-400 shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-base">{n.icon}</span>
                <span>{n.label}</span>
              </span>
              {badge && (
                <span className="rounded-full bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV.slice(0, 5);
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white md:hidden">
      <div className="grid grid-cols-5">
        {items.map((n) => {
          const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                active ? "text-orange-600" : "text-slate-500"
              }`}
            >
              <span className="text-base">{n.icon}</span>
              <span className="leading-tight">{n.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
