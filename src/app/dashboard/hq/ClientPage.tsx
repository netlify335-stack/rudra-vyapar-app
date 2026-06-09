"use client";

import { useLocalDbQuery } from "@/hooks/useLocalDb";
import { stores, invoices, parties } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { formatINR } from "@/lib/format";

export function HqClient({ ownerId }: { ownerId: string }) {
  const { data, loading, error } = useLocalDbQuery(async (db) => {
    // Fetch all branches
    const allStores = await db.select().from(stores).where(eq(stores.ownerId, ownerId));
    const storeIds = allStores.map((s: any) => s.id);

    if (storeIds.length === 0) {
      return { allStores: [], totalSales: 0, totalUdhaar: 0, branchData: [] };
    }

    // Get today's sales for all branches
    const salesResult = await db
      .select({
        storeId: invoices.storeId,
        total: sql`sum(CAST(${invoices.totalAmount} AS NUMERIC))`,
      })
      .from(invoices)
      .where(eq(invoices.type, "sale"))
      .groupBy(invoices.storeId);

    // Get total Udhaar (outstanding balance) for all branches (customers only)
    const udhaarResult = await db
      .select({
        storeId: parties.storeId,
        total: sql`sum(CAST(${parties.outstandingBalance} AS NUMERIC))`,
      })
      .from(parties)
      .where(eq(parties.type, "customer"))
      .groupBy(parties.storeId);

    let totalSales = 0;
    let totalUdhaar = 0;
    
    const branchData = allStores.map((s: any) => {
      const sale = Number(salesResult.find((x: any) => x.storeId === s.id)?.total || 0);
      const udhaar = Number(udhaarResult.find((x: any) => x.storeId === s.id)?.total || 0);
      
      totalSales += sale;
      totalUdhaar += udhaar;
      
      return {
        id: s.id,
        name: s.name,
        location: s.address,
        sales: sale,
        udhaar: udhaar,
      };
    });

    return { allStores, totalSales, totalUdhaar, branchData };
  }, [ownerId]);

  if (loading) return <div>Loading HQ Data...</div>;
  if (error) return <div className="text-rose-600">Failed to load data: {error.message}</div>;
  if (!data) return null;

  const { branchData, totalSales, totalUdhaar } = data;

  if (branchData.length === 0) {
    return <div>No stores found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">HQ Dashboard 🏢</h1>
          <p className="text-sm text-slate-500">Super Admin overview for all your branches</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg text-white shadow-md">📊</div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Lifetime Sales (All Branches)</div>
          <div className="mt-1 text-3xl font-bold text-slate-950">{formatINR(totalSales)}</div>
        </div>
        
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-lg text-white shadow-md">📒</div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Udhaar Market (All Branches)</div>
          <div className="mt-1 text-3xl font-bold text-slate-950">{formatINR(totalUdhaar)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Branch Performance</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-2.5 text-left">Branch Name</th>
              <th className="px-5 py-2.5 text-left">Location</th>
              <th className="px-5 py-2.5 text-right">Lifetime Sales</th>
              <th className="px-5 py-2.5 text-right">Udhaar Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {branchData.map((b: any) => (
              <tr key={b.id} className="hover:bg-slate-50 transition">
                <td className="px-5 py-3 font-semibold text-slate-900">{b.name}</td>
                <td className="px-5 py-3 text-slate-500">{b.location || "—"}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-700">{formatINR(b.sales)}</td>
                <td className="px-5 py-3 text-right font-bold text-rose-600">{formatINR(b.udhaar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
