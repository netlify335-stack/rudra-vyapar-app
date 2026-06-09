// @ts-nocheck
"use client";

import type { ReactNode } from "react";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { stores, products, batches, parties } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { RudraChat } from "@/components/chat/RudraChat";
import { StoreOnboardingModal } from "@/components/StoreOnboardingModal";
import { useLocalDbQuery } from "@/hooks/useLocalDb";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [licenseValid, setLicenseValid] = useState<boolean | null>(null);
  const [licenseMsg, setLicenseMsg] = useState("");

  useEffect(() => {
    // Validate license on load
    fetch("/api/license/validate", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (!data.valid) {
          setLicenseValid(false);
          setLicenseMsg(data.error || "Your license has expired.");
        } else {
          setLicenseValid(true);
        }
      })
      .catch(() => {
        // If offline and can't verify, we could allow grace period, but for now strict:
        // Actually, if offline, we assume valid until they come online
        setLicenseValid(true);
      });
  }, []);

  const { data, loading, error } = useLocalDbQuery(async (db) => {
    // Basic local store logic: pick first store or create one
    let allStores = await db.select({ id: stores.id, name: stores.name, location: stores.address }).from(stores);
    let store = allStores[0];

    if (!store) {
      // Auto-create a default store for the offline user
      const defaultId = uuidv4();
      await db.insert(stores).values({
        id: defaultId,
        name: "My Local Store",
        ownerId: uuidv4(), // local placeholder
      });
      allStores = await db.select({ id: stores.id, name: stores.name, location: stores.address }).from(stores);
      store = allStores[0];
    }

    // Get alert counts
    const lowStock = await db.select({ count: sql<number>`count(*)::int` })
      .from(products).where(and(eq(products.storeId, store.id), sql`${products.currentStock} <= ${products.minStockLevel}`));
    
    const in10 = new Date();
    in10.setDate(in10.getDate() + 10);
    const expAlert = await db.select({ count: sql<number>`count(*)::int` })
      .from(batches).where(and(eq(batches.storeId, store.id), sql`${batches.expiryDate} <= ${in10.toISOString().slice(0,10)}`));
      
    const debtAlert = await db.select({ count: sql<number>`count(*)::int` })
      .from(parties).where(and(eq(parties.storeId, store.id), eq(parties.type, "customer"), sql`${parties.outstandingBalance} > 0`));

    return {
      store,
      allStores,
      alerts: {
        lowStock: lowStock[0]?.count || 0,
        expiringSoon: expAlert[0]?.count || 0,
        debtors: debtAlert[0]?.count || 0,
      }
    };
  }, []);

  if (licenseValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6 inline-grid h-16 w-16 place-items-center rounded-full bg-rose-500/10 text-3xl text-rose-500">
            🔒
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">License Locked</h2>
          <p className="mb-8 text-slate-400">{licenseMsg}</p>
          <button 
            onClick={() => router.push("/login")}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 font-semibold text-white hover:opacity-90"
          >
            Enter New Key
          </button>
        </div>
      </div>
    );
  }

  if (loading || licenseValid === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Starting Rudra Vyapar (Offline)...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-red-500">Failed to load local database.</div>;
  }

  const { store, allStores, alerts } = data;
  const location = store.location || "—";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <StoreOnboardingModal store={store as any} />
      <div className="print:hidden">
        <Sidebar alerts={alerts} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden relative z-50">
          <TopBar currentStoreId={store.id} storeName={store.name} location={location} alerts={alerts} allStores={allStores} />
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
