import { db } from "@/db";
import { invoices, invoiceItems, products } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { formatINR, formatDate } from "@/lib/format";
import { HistoryFilter } from "./HistoryFilter";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: { filter?: string; start?: string; end?: string } }) {
  const storeId = await getActiveStoreId();
  if (!storeId) return null;

  const filter = searchParams.filter || "today";
  let startDate = "";
  let endDate = "";

  const now = new Date();
  
  if (filter === "today") {
    startDate = now.toISOString().slice(0, 10);
    endDate = startDate;
  } else if (filter === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    startDate = yesterday.toISOString().slice(0, 10);
    endDate = startDate;
  } else if (filter === "custom") {
    startDate = searchParams.start || now.toISOString().slice(0, 10);
    endDate = searchParams.end || now.toISOString().slice(0, 10);
  }

  // Calculate totals
  const totalSalesRow = await db
    .select({ total: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)` })
    .from(invoices)
    .where(
      and(
        eq(invoices.storeId, storeId),
        eq(invoices.type, "sale"),
        gte(invoices.invoiceDate, startDate),
        lte(invoices.invoiceDate, endDate)
      )
    );

  const netSalesRow = await db
    .select({
      net: sql<string>`coalesce(sum(${invoiceItems.quantity} * (${invoiceItems.rate} - ${products.purchasePrice})), 0)`
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
    .innerJoin(products, eq(products.id, invoiceItems.productId))
    .where(
      and(
        eq(invoices.storeId, storeId),
        eq(invoices.type, "sale"),
        gte(invoices.invoiceDate, startDate),
        lte(invoices.invoiceDate, endDate)
      )
    );

  // Customer Breakdown
  const breakdown = await db
    .select({
      partyName: invoices.partyName,
      invoiceCount: sql<number>`count(distinct ${invoices.id})::int`,
      totalAmount: sql<string>`coalesce(sum(${invoiceItems.totalAmount}), 0)`,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
    .where(
      and(
        eq(invoices.storeId, storeId),
        eq(invoices.type, "sale"),
        gte(invoices.invoiceDate, startDate),
        lte(invoices.invoiceDate, endDate)
      )
    )
    .groupBy(invoices.partyName)
    .orderBy(desc(sql`sum(${invoiceItems.totalAmount})`));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Sales History 🕒</h1>
          <p className="text-sm text-slate-500">Track your sales and net earnings.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <HistoryFilter currentFilter={filter} currentStart={startDate} currentEnd={endDate} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-md">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-80">Total Sales</div>
          <div className="mt-2 text-3xl font-bold">{formatINR(totalSalesRow[0]?.total ?? 0)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-500 to-fuchsia-600 p-6 text-white shadow-md">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-80">Net Sales (Profit)</div>
          <div className="mt-2 text-3xl font-bold">{formatINR(netSalesRow[0]?.net ?? 0)}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Customer Breakdown</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left">Customer</th>
              <th className="px-5 py-3 text-right">Invoices</th>
              <th className="px-5 py-3 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {breakdown.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{row.partyName || "Walk-in"}</td>
                <td className="px-5 py-3 text-right text-slate-600">{row.invoiceCount}</td>
                <td className="px-5 py-3 text-right font-bold text-slate-900">{formatINR(row.totalAmount)}</td>
              </tr>
            ))}
            {breakdown.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">No sales in this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
