import { db } from "@/db";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";
import { SettingsForm } from "./SettingsForm";
import { LicenseSettingsCard } from "./LicenseSettingsCard";
import { BackupRestoreCard } from "./BackupRestoreCard";
import { DataExportCard } from "./DataExportCard";
import { LanguageSettings } from "./LanguageSettings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { licenses } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const storeId = (await getActiveStoreId())!;
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  const [license] = await db.select().from(licenses).where(eq(licenses.storeId, storeId)).limit(1);

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
