import { db } from "@/db";
import { invoices, parties } from "@/db/schema";
import { and, desc, eq, gte, lte, isNull, ilike, or } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";
import { formatINR, formatDate } from "@/lib/format";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { PurchaseFilter } from "./PurchaseFilter";

export const dynamic = "force-dynamic";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const storeId = (await getActiveStoreId())!;
  const params = await searchParams;
  const qStr = (params.q as string) || "";
  const dateFilter = (params.dateFilter as string) || "all";
  const start = (params.start as string) || "";
  const end = (params.end as string) || "";
  const supplier = (params.supplier as string) || "all";
  const mode = (params.mode as string) || "all";

  let dateCondition = undefined;
  if (dateFilter === "today") {
    const today = new Date().toISOString().split("T")[0];
    dateCondition = eq(invoices.invoiceDate, today);
  } else if (dateFilter === "yesterday") {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    dateCondition = eq(invoices.invoiceDate, yest.toISOString().split("T")[0]);
  } else if (dateFilter === "custom" && start && end) {
    dateCondition = and(
      gte(invoices.invoiceDate, start),
      lte(invoices.invoiceDate, end)
    );
  }

  const purchases = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.storeId, storeId),
        eq(invoices.type, "purchase"),
        dateCondition,
        supplier !== "all"
          ? supplier === "walkin"
            ? isNull(invoices.partyId) // Null means walk-in
            : eq(invoices.partyId, supplier)
          : undefined,
        mode !== "all" 
          ? or(eq(invoices.paymentMode, mode), eq(invoices.splitPaymentMode1, mode), eq(invoices.splitPaymentMode2, mode)) 
          : undefined,
        qStr ? or(ilike(invoices.invoiceNo, `%${qStr}%`), ilike(invoices.partyName, `%${qStr}%`)) : undefined
      )
    )
    .orderBy(desc(invoices.createdAt));

  const suppliersList = await db.select({ id: parties.id, name: parties.name }).from(parties).where(and(eq(parties.storeId, storeId), eq(parties.type, "supplier")));

  let sumTotal = 0, sumPaid = 0, sumDue = 0;
  purchases.forEach(r => {
    sumTotal += Number(r.totalAmount) || 0;
    sumPaid += Number(r.paidAmount) || 0;
    sumDue += Number(r.balanceDue) || 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Purchases 🛒</h1>
          <p className="text-sm text-slate-500">Manage inward stock and supplier bills.</p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          New Purchase
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Amount</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatINR(sumTotal)}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Paid Amount</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">{formatINR(sumPaid)}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Due Amount</div>
          <div className="mt-1 text-2xl font-bold text-rose-900">{formatINR(sumDue)}</div>
        </div>
      </div>

      <PurchaseFilter
        currentQ={qStr}
        currentDateFilter={dateFilter}
        currentStart={start}
        currentEnd={end}
        currentSupplier={supplier}
        currentMode={mode}
        parties={suppliersList}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Bill No</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Supplier</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50 group relative">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/invoices/${r.id}`} className="absolute inset-0" aria-label={`View invoice ${r.invoiceNo}`}></Link>
                    <span className="font-mono text-xs font-semibold text-indigo-600 group-hover:underline pointer-events-none">
                      {r.invoiceNo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.invoiceDate)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{r.partyName || "Cash Supplier"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="rounded-md bg-slate-100 px-2 py-1 inline-block text-[10px] font-semibold uppercase text-slate-700 whitespace-nowrap">
                      {r.paymentMode === 'partial' 
                        ? `Partial: ${r.splitPaymentMode1} (${formatINR(Number(r.splitAmount1))}) + ${r.splitPaymentMode2} (${formatINR(Number(r.splitAmount2))})` 
                        : r.paymentMode}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatINR(r.totalAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        Number(r.balanceDue) > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {Number(r.balanceDue) > 0 ? `Unpaid ${formatINR(r.balanceDue, true)}` : "Paid"}
                    </span>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No purchase bills found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
