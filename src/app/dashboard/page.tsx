// @ts-nocheck
"use client";

import { invoices, expenses, parties, products, batches, invoiceItems } from "@/db/schema";
import { and, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import Link from "next/link";
import { formatINR, formatDate, formatNumber } from "@/lib/format";
import { LineChart, BarChart, DonutChart } from "@/components/Charts";
import { SmartInsights } from "./components/SmartInsights";
import { useLocalDbQuery } from "@/hooks/useLocalDb";

export default function DashboardHome() {
  const storeId = "local-store"; // For local DB, we can default to a single store

  const { data, loading } = useLocalDbQuery(async (db) => {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().slice(0, 10);
    const sevenAgo = new Date();
    sevenAgo.setDate(sevenAgo.getDate() - 6);
    const sevenAgoStr = sevenAgo.toISOString().slice(0, 10);

    const todaysSale = await db
      .select({ total: sql<string>`coalesce(sum(${invoices.totalAmount}),0)` })
      .from(invoices)
      .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), eq(invoices.invoiceDate, today)));

    const monthSale = await db
      .select({
        total: sql<string>`coalesce(sum(${invoices.totalAmount}),0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), gte(invoices.invoiceDate, monthStartStr)));

    const todaysCollection = await db
      .select({ total: sql<string>`coalesce(sum(${invoices.paidAmount}),0)` })
      .from(invoices)
      .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), eq(invoices.invoiceDate, today)));

    const udhaarRow = await db
      .select({ total: sql<string>`coalesce(sum(${parties.outstandingBalance}),0)`, count: sql<number>`count(*)::int` })
      .from(parties)
      .where(and(eq(parties.storeId, storeId), eq(parties.type, "customer"), gt(parties.outstandingBalance, "0")));

    const payableRow = await db
      .select({ total: sql<string>`coalesce(sum(${parties.outstandingBalance}),0)` })
      .from(parties)
      .where(and(eq(parties.storeId, storeId), eq(parties.type, "supplier")));

    const netEarnRow = await db
      .select({
        netEarn: sql<string>`coalesce(sum(${invoiceItems.quantity} * (${invoiceItems.rate} - ${products.purchasePrice})), 0)`
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
      .innerJoin(products, eq(products.id, invoiceItems.productId))
      .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), eq(invoices.invoiceDate, today)));

    const daily = await db
      .select({
        d: sql<string>`to_char(${invoices.invoiceDate}, 'YYYY-MM-DD')`,
        total: sql<string>`coalesce(sum(${invoices.totalAmount}),0)`,
      })
      .from(invoices)
      .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), gte(invoices.invoiceDate, sevenAgoStr)))
      .groupBy(sql`to_char(${invoices.invoiceDate}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${invoices.invoiceDate}, 'YYYY-MM-DD')`);

    const topProducts = await db
      .select({
        name: invoiceItems.productName,
        total: sql<string>`coalesce(sum(${invoiceItems.totalAmount}),0)`,
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
      .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale")))
      .groupBy(invoiceItems.productName)
      .orderBy(desc(sql`sum(${invoiceItems.totalAmount})`))
      .limit(5);

    const paySplit = await db
      .select({
        mode: invoices.paymentMode,
        total: sql<string>`coalesce(sum(${invoices.totalAmount}),0)`,
      })
      .from(invoices)
      .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), gte(invoices.invoiceDate, monthStartStr)))
      .groupBy(invoices.paymentMode);

    const lowStock = await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), sql`${products.currentStock} <= ${products.minStockLevel}`))
      .limit(5);

    const in10 = new Date();
    in10.setDate(in10.getDate() + 10);
    const expiring = await db
      .select({
        batchId: batches.id,
        batchNo: batches.batchNo,
        expiryDate: batches.expiryDate,
        quantity: batches.quantity,
        productName: products.name,
      })
      .from(batches)
      .innerJoin(products, eq(products.id, batches.productId))
      .where(and(eq(batches.storeId, storeId), gt(batches.quantity, "0"), lte(batches.expiryDate, in10.toISOString().slice(0, 10))))
      .orderBy(batches.expiryDate)
      .limit(5);

    const recent = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale")))
      .orderBy(desc(invoices.createdAt))
      .limit(6);

    return {
      todaysSale, monthSale, todaysCollection, udhaarRow, payableRow, netEarnRow,
      daily, topProducts, paySplit, lowStock, expiring, recent
    };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Dashboard Data Offline...</div>;
  }

  if (!data) return <div>Error loading data</div>;

  const {
    todaysSale, monthSale, todaysCollection, udhaarRow, netEarnRow,
    daily, topProducts, paySplit, lowStock, expiring, recent
  } = data;

  const dailyMap = new Map(daily.map((r: any) => [r.d, Number(r.total)]));
  const trend: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    const lbl = dt.toLocaleDateString("en-IN", { weekday: "short" });
    trend.push({ label: lbl, value: dailyMap.get(key) ?? 0 });
  }

  const PAY_COLORS: Record<string, string> = {
    cash: "#10B981",
    upi: "#6366F1",
    card: "#F97316",
    credit: "#EF4444",
    bank: "#0EA5E9",
  };
  const paySegments = paySplit.map((p: any) => ({
    label: (p.mode || "other").toUpperCase(),
    value: Number(p.total),
    color: PAY_COLORS[p.mode || ""] || "#94A3B8",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Namaste 👋</h1>
          <p className="text-sm text-slate-500">Here&apos;s how your shop is doing today.</p>
        </div>
        <Link
          href="/dashboard/billing"
          className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200"
        >
          + New Sale
        </Link>
      </div>

      <SmartInsights />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="💰"
          label="Today's Sales"
          value={formatINR(todaysSale[0]?.total ?? 0)}
          sub={`${monthSale[0]?.count ?? 0} invoices this month`}
          tint="from-emerald-500 to-teal-600"
        />
        <KpiCard
          icon="📈"
          label="Today's Net Earn"
          value={formatINR(netEarnRow[0]?.netEarn ?? 0)}
          sub="Profit (Sale - Purchase)"
          tint="from-purple-500 to-fuchsia-600"
        />
        <KpiCard
          icon="📥"
          label="Today's Collection"
          value={formatINR(todaysCollection[0]?.total ?? 0)}
          sub="Cash + UPI + Card"
          tint="from-sky-500 to-indigo-600"
        />
        <KpiCard
          icon="📒"
          label="Customers owe you"
          value={formatINR(udhaarRow[0]?.total ?? 0)}
          sub={`${udhaarRow[0]?.count ?? 0} parties on udhaar`}
          tint="from-orange-500 to-rose-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead title="Sales — Last 7 days" sub={`Total ${formatINR(trend.reduce((s, t) => s + t.value, 0))}`} />
          <LineChart data={trend} />
        </Card>
        <Card>
          <CardHead title="Payment mode" sub="This month" />
          {paySegments.length ? <DonutChart segments={paySegments} /> : <Empty label="No sales this month" />}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead title="Top selling products" sub="All time" link="/dashboard/inventory" />
          {topProducts.length ? (
            <BarChart data={topProducts.map((p: any) => ({ label: p.name, value: Number(p.total) }))} />
          ) : (
            <Empty />
          )}
        </Card>
        <Card>
          <CardHead title="Low stock alerts" sub={`${lowStock.length} items need reorder`} link="/dashboard/inventory" />
          <div className="divide-y divide-slate-100">
            {lowStock.length === 0 && <Empty label="All stocked up 🎉" />}
            {lowStock.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-500">Min {formatNumber(Number(p.minStockLevel), 1)} {p.unit}</div>
                </div>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                  {formatNumber(Number(p.currentStock), 1)} {p.unit}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead title="Recent invoices" link="/dashboard/invoices" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2">Invoice</th>
                  <th className="pb-2">Party</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((r: any) => (
                  <tr key={r.id}>
                    <td className="py-2.5 font-mono text-xs text-slate-700">{r.invoiceNo}</td>
                    <td className="py-2.5 text-slate-800">{r.partyName}</td>
                    <td className="py-2.5 text-slate-600">{formatDate(r.invoiceDate)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">{formatINR(r.totalAmount)}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          Number(r.balanceDue) > 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {Number(r.balanceDue) > 0 ? `Due ${formatINR(r.balanceDue, true)}` : "Paid"}
                      </span>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-slate-400">No invoices yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHead title="Expiring soon" sub="Within 90 days" link="/dashboard/inventory" />
          <div className="divide-y divide-slate-100">
            {expiring.length === 0 && <Empty label="No expiring batches" />}
            {expiring.map((b: any) => {
              const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={b.batchId} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{b.productName}</div>
                      <div className="text-[11px] text-slate-500">Batch {b.batchNo} · {formatNumber(Number(b.quantity), 0)} units</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${days <= 30 ? "bg-rose-100 text-rose-700" : days <= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                      {days}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, tint }: { icon: string; label: string; value: string; sub: string; tint: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tint} opacity-10`} />
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tint} text-lg text-white shadow-md`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors ${className}`}>{children}</div>;
}

export function CardHead({ title, sub, link }: { title: string; sub?: string; link?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
      {link && (
        <Link href={link} className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline">View all →</Link>
      )}
    </div>
  );
}

export function Empty({ label = "No data yet" }: { label?: string }) {
  return <div className="grid h-32 place-items-center text-sm text-slate-400 dark:text-slate-500">{label}</div>;
}
