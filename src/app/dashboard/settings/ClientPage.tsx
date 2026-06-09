"use client";

import { useLocalDbQuery } from "@/hooks/useLocalDb";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./SettingsForm";
import { LicenseSettingsCard } from "./LicenseSettingsCard";
import { BackupRestoreCard } from "./BackupRestoreCard";
import { DataExportCard } from "./DataExportCard";
import { LanguageSettings } from "./LanguageSettings";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SettingsClient({ storeId }: { storeId: string }) {
  const { data, loading, error } = useLocalDbQuery(async (db) => {
    const storeRes = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    
    return {
      store: storeRes[0] || null,
      license: null,
    };
  }, [storeId]);

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div className="text-rose-600">Failed to load settings: {error.message}</div>;
  if (!data || !data.store) return <div>Store not found.</div>;

  const { store, license } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Settings ⚙️</h1>
        <p className="text-sm text-slate-500">Manage your store profile, taxes, and billing preferences.</p>
      </div>

      <SettingsForm store={store} />

      <div className="grid gap-6 md:grid-cols-3">
        <LanguageSettings />
        <ThemeToggle />
        {license ? <LicenseSettingsCard license={license} /> : <ActionCard icon="👥" title="Staff & Roles" desc="Add cashiers, managers with PIN login." cta="Coming soon" />}
        <BackupRestoreCard />
        <DataExportCard />
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, cta }: { icon: string; title: string; desc: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl">{icon}</div>
      <h4 className="mt-3 text-sm font-bold text-slate-900">{title}</h4>
      <p className="mt-1 text-xs text-slate-600">{desc}</p>
      <button className="mt-4 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500" disabled>
        {cta}
      </button>
    </div>
  );
}
