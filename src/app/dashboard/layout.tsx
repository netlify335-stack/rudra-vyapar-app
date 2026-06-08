import type { ReactNode } from "react";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { requireStore } from "@/lib/session";
import { getAlertCounts } from "@/lib/dashboard-data";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { RudraChat } from "@/components/chat/RudraChat";
import { StoreOnboardingModal } from "@/components/StoreOnboardingModal";

export const dynamic = "force-dynamic";

async function ensureSeeded() {
  const existing = await db.select({ id: stores.id }).from(stores).limit(1);
  if (!existing[0]) {
    // self-seed by calling the seed route helper indirectly
    const mod = await import("@/app/api/seed/route");
    await mod.GET();
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const store = await requireStore();
  const alerts = await getAlertCounts(store.id);
  const location = [store.address, store.state].filter(Boolean).join(" · ");
  
  // Fetch all stores for the store switcher
  const allStores = await db.select({ id: stores.id, name: stores.name, location: stores.address }).from(stores).where(eq(stores.ownerId, store.ownerId!));

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <StoreOnboardingModal store={store} />
      <div className="print:hidden">
        <Sidebar alerts={alerts} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden relative z-50">
          <TopBar currentStoreId={store.id} storeName={store.name} location={location || "—"} alerts={alerts} allStores={allStores} />
        </div>
        <main className="flex-1 px-5 pb-24 pt-6 md:px-8 md:pb-8 print:p-0 print:m-0">{children}</main>
        <div className="print:hidden">
          <MobileNav />
        </div>
      </div>
      <div className="print:hidden">
        <RudraChat storeName={store.name} alerts={alerts} />
      </div>
    </div>
  );
}
