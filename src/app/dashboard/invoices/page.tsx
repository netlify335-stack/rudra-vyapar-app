import { db } from "@/db";
import { invoices, parties } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import Link from "next/link";
import { getActiveStoreId } from "@/lib/session";
import { formatINR, formatDate } from "@/lib/format";
import { InvoiceFilter } from "./InvoiceFilter";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const storeId = (await getActiveStoreId())!;
  const params = await searchParams;
  const dateFilter = (params.dateFilter as string) || "all";
  const start = (params.start as string) || "";
  const end = (params.end as string) || "";
  const customer = (params.customer as string) || "all";
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

  const list = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.storeId, storeId),
        eq(invoices.type, "sale"),
        dateCondition,
        customer !== "all"
          ? customer === "walkin"
            ? eq(invoices.partyId, null as any) // Null means walk-in
            : eq(invoices.partyId, customer)
          : undefined,
        mode !== "all" ? eq(invoices.paymentMode, mode) : undefined
      )
    )
    .orderBy(desc(invoices.createdAt))
    .limit(100);

  const customersList = await db.select({ id: parties.id, name: parties.name }).from(parties).where(and(eq(parties.storeId, storeId), eq(parties.type, "customer")));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Sale Invoices</h1>
          <p className="text-sm text-slate-500">{list.length} invoices</p>
        </div>
        <Link href="/dashboard/billing" className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">+ New Invoice</Link>
      </div>

      <InvoiceFilter
        currentDateFilter={dateFilter}
        currentStart={start}
        currentEnd={end}
        currentCustomer={customer}
        currentMode={mode}
        parties={customersList}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Party</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Due</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50 transition group relative cursor-pointer">
                  <td className="px-5 py-3 relative">
                    <Link href={`/dashboard/invoices/${i.id}`} className="absolute inset-0" aria-label={`View invoice ${i.invoiceNo}`}></Link>
                    <span className="font-mono text-xs font-semibold text-slate-900 group-hover:underline pointer-events-none">{i.invoiceNo}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 pointer-events-none">{formatDate(i.invoiceDate)}</td>
                  <td className="px-5 py-3 text-slate-800">{i.partyName}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-700">
                      {i.paymentMode}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatINR(i.totalAmount)}</td>
                  <td className="px-5 py-3 text-right">
                    {Number(i.balanceDue) > 0 ? (
                      <span className="font-semibold text-rose-600">{formatINR(i.balanceDue)}</span>
                    ) : (
                      <span className="text-emerald-600">✓ Paid</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/dashboard/invoices/${i.id}`} className="text-xs font-semibold text-orange-600 hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No invoices yet — start with /dashboard/billing</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
