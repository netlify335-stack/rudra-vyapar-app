// @ts-nocheck
"use client";
import { parties } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { formatINR } from "@/lib/format";
import Link from "next/link";
import { AddPartyForm } from "./AddPartyForm";
import { useLocalDbQuery } from "@/hooks/useLocalDb";

type Party = typeof parties.$inferSelect;

export default function PartiesClient({ storeId }: { storeId: string }) {
  const { data: all, loading, error } = useLocalDbQuery(async (db) => {
    return db.select().from(parties).where(eq(parties.storeId, storeId)).orderBy(asc(parties.name));
  }, [storeId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading parties</div>;

  const customers = all?.filter((p) => p.type === "customer") || [];
  const suppliers = all?.filter((p) => p.type === "supplier") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Parties 👥</h1>
        <p className="text-sm text-slate-500">{customers.length} customers · {suppliers.length} suppliers</p>
      </div>

      <AddPartyForm storeId={storeId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PartiesList title="Customers" parties={customers} />
        <PartiesList title="Suppliers" parties={suppliers} />
      </div>
    </div>
  );
}

function PartiesList({ title, partiesList }: { title: string; partiesList: Party[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {partiesList.map((p) => (
          <Link key={p.id} href={`/dashboard/khata/${p.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
            <div>
              <div className="font-semibold text-slate-900">{p.name}</div>
              <div className="text-xs text-slate-500">{p.phone || "—"} {p.city ? `· ${p.city}` : ""}</div>
            </div>
            <div className={`text-sm font-bold ${Number(p.outstandingBalance) > 0 ? "text-rose-600" : Number(p.outstandingBalance) < 0 ? "text-emerald-600" : "text-slate-400"}`}>
              {Number(p.outstandingBalance) === 0 ? "—" : formatINR(Math.abs(Number(p.outstandingBalance)))}
            </div>
          </Link>
        ))}
        {partiesList.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No {title.toLowerCase()} yet</div>}
      </div>
    </div>
  );
}
