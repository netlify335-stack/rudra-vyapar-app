import { db } from "@/db";
import { invoices, invoiceItems, expenses, products } from "@/db/schema";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";
import { formatINR, formatNumber } from "@/lib/format";
import { LineChart, BarChart, DonutChart } from "@/components/Charts";
import { ReportFilter } from "./ReportFilter";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const storeId = (await getActiveStoreId())!;
  const params = await searchParams;
  const dateFilter = (params.dateFilter as string) || "all";
  const start = (params.start as string) || "";
  const end = (params.end as string) || "";

  // Indian FY: April 1 → March 31
  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyStart = `${fyStartYear}-04-01`;
  const fyEnd = `${fyStartYear + 1}-03-31`;

  let dateCondition = gte(invoices.invoiceDate, fyStart); // Default to FY
  let expDateCondition = gte(expenses.expenseDate, fyStart);

  if (dateFilter === "this_month") {
    const mStart = new Date(); mStart.setDate(1);
    dateCondition = gte(invoices.invoiceDate, mStart.toISOString().slice(0, 10));
    expDateCondition = gte(expenses.expenseDate, mStart.toISOString().slice(0, 10));
  } else if (dateFilter === "today") {
    const today = new Date().toISOString().slice(0, 10);
    dateCondition = eq(invoices.invoiceDate, today);
    expDateCondition = eq(expenses.expenseDate, today);
  } else if (dateFilter === "yesterday") {
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().slice(0, 10);
    dateCondition = eq(invoices.invoiceDate, yestStr);
    expDateCondition = eq(expenses.expenseDate, yestStr);
  } else if (dateFilter === "custom" && start && end) {
    dateCondition = and(gte(invoices.invoiceDate, start), lte(invoices.invoiceDate, end)) as any;
    expDateCondition = and(gte(expenses.expenseDate, start), lte(expenses.expenseDate, end)) as any;
  }

  // Monthly sales (last 6 months)
  const monthly = await db
    .select({
      m: sql<string>`to_char(${invoices.invoiceDate}, 'YYYY-MM')`,
      total: sql<string>`coalesce(sum(${invoices.totalAmount}),0)`,
      taxable: sql<string>`coalesce(sum(${invoices.taxableAmount}),0)`,
      tax: sql<string>`coalesce(sum(${invoices.cgstAmount} + ${invoices.sgstAmount} + ${invoices.igstAmount}),0)`,
    })
    .from(invoices)
    .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), dateCondition))
    .groupBy(sql`to_char(${invoices.invoiceDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${invoices.invoiceDate}, 'YYYY-MM')`);

  // GST summary (Filtered)
  const gstSummary = await db
    .select({
      rate: invoiceItems.gstRate,
      taxable: sql<string>`coalesce(sum(${invoiceItems.taxableAmount}),0)`,
      tax: sql<string>`coalesce(sum(${invoiceItems.taxAmount}),0)`,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
    .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), dateCondition))
    .groupBy(invoiceItems.gstRate)
    .orderBy(invoiceItems.gstRate);

  // P&L
  const salesAgg = await db.select({
    rev: sql<string>`coalesce(sum(${invoices.totalAmount}),0)`,
    taxable: sql<string>`coalesce(sum(${invoices.taxableAmount}),0)`,
  }).from(invoices).where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), dateCondition));

  // Approx COGS: sum of (sold qty × purchase price). We do a quick join.
  const cogsAgg = await db
    .select({ cogs: sql<string>`coalesce(sum(${invoiceItems.quantity} * p.purchase_price), 0)` })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
    .innerJoin(sql`products p`, sql`p.id = ${invoiceItems.productId}`)
    .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), dateCondition));

  const expAgg = await db.select({ total: sql<string>`coalesce(sum(${expenses.amount}),0)` })
    .from(expenses).where(and(eq(expenses.storeId, storeId), expDateCondition));

  const rev = Number(salesAgg[0]?.rev ?? 0);
  const cogs = Number(cogsAgg[0]?.cogs ?? 0);
  const exp = Number(expAgg[0]?.total ?? 0);
  const grossProfit = rev - cogs;
  const netProfit = grossProfit - exp;

  // Top customers
  const topCustomers = await db
    .select({
      name: invoices.partyName,
      total: sql<string>`coalesce(sum(${invoices.totalAmount}),0)`,
    })
    .from(invoices)
    .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), dateCondition))
    .groupBy(invoices.partyName)
    .orderBy(desc(sql`sum(${invoices.totalAmount})`))
    .limit(5);

  // Top suppliers (Purchases)
  const topSuppliers = await db
    .select({
      name: invoices.partyName,
      total: sql<string>`coalesce(sum(${invoices.totalAmount}),0)`,
    })
    .from(invoices)
    .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "purchase"), dateCondition))
    .groupBy(invoices.partyName)
    .orderBy(desc(sql`sum(${invoices.totalAmount})`))
    .limit(5);

  // Category Performance
  const catPerf = await db
    .select({
      category: products.category,
      total: sql<string>`coalesce(sum(${invoiceItems.totalAmount}),0)`,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
    .innerJoin(products, eq(products.id, invoiceItems.productId))
    .where(and(eq(invoices.storeId, storeId), eq(invoices.type, "sale"), dateCondition))
    .groupBy(products.category)
    .orderBy(desc(sql`sum(${invoiceItems.totalAmount})`));

  const trendData = monthly.map((m) => ({
    label: new Date(`${m.m}-01`).toLocaleDateString("en-IN", { month: "short" }),
    value: Number(m.total),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Reports & Dashboards 📊</h1>
        <p className="text-sm text-slate-500">Analyze Sales, Purchases, Categories and GST</p>
      </div>

      <ReportFilter currentFilter={dateFilter} currentStart={start} currentEnd={end} />

      {/* P&L cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PLCard label="Revenue" value={formatINR(rev)} tint="from-emerald-500 to-teal-600" icon="💰" />
        <PLCard label="COGS" value={formatINR(cogs)} tint="from-amber-500 to-orange-600" icon="📦" />
        <PLCard label="Operating Expenses" value={formatINR(exp)} tint="from-rose-500 to-pink-600" icon="💸" />
        <PLCard label="Net Profit" value={formatINR(netProfit)} tint={netProfit >= 0 ? "from-indigo-500 to-purple-600" : "from-rose-500 to-rose-700"} icon="📈" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold">Monthly Sales Trend</h3>
          <LineChart data={trendData} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold">Category Performance</h3>
          {catPerf.length > 0 ? (
            <DonutChart segments={catPerf.map((c, i) => ({ 
               label: c.category || "Uncategorized", 
               value: Number(c.total),
               color: ["#F97316", "#10B981", "#6366F1", "#EC4899", "#8B5CF6"][i % 5]
            }))} />
          ) : (
            <div className="grid h-40 place-items-center text-sm text-slate-400">No data</div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold">Top Customers (Sales)</h3>
          {topCustomers.length > 0 ? (
            <BarChart data={topCustomers.map((c) => ({ label: c.name || "—", value: Number(c.total) }))} />
          ) : (
            <div className="grid h-40 place-items-center text-sm text-slate-400">No data</div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold">Top Suppliers (Purchases)</h3>
          {topSuppliers.length > 0 ? (
            <BarChart data={topSuppliers.map((c) => ({ label: c.name || "—", value: Number(c.total) }))} />
          ) : (
            <div className="grid h-40 place-items-center text-sm text-slate-400">No purchases found</div>
          )}
        </div>
      </div>

      {/* GSTR-1 / 3B style summary */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">GST Summary (GSTR-1 / 3B preview)</h3>
          <p className="text-[11px] text-slate-500">Output tax payable on outward supplies</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-2.5 text-left">GST Rate</th>
              <th className="px-5 py-2.5 text-right">Taxable Value</th>
              <th className="px-5 py-2.5 text-right">CGST</th>
              <th className="px-5 py-2.5 text-right">SGST</th>
              <th className="px-5 py-2.5 text-right">Total Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gstSummary.map((g) => (
              <tr key={String(g.rate)}>
                <td className="px-5 py-2.5 font-semibold text-slate-900">{Number(g.rate)}%</td>
                <td className="px-5 py-2.5 text-right">{formatINR(g.taxable)}</td>
                <td className="px-5 py-2.5 text-right">{formatINR(Number(g.tax) / 2)}</td>
                <td className="px-5 py-2.5 text-right">{formatINR(Number(g.tax) / 2)}</td>
                <td className="px-5 py-2.5 text-right font-bold text-slate-900">{formatINR(g.tax)}</td>
              </tr>
            ))}
            {gstSummary.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-400">No sales this month</td></tr>}
          </tbody>
          {gstSummary.length > 0 && (
            <tfoot className="bg-slate-50">
              <tr>
                <td className="px-5 py-3 font-bold text-slate-900">TOTAL</td>
                <td className="px-5 py-3 text-right font-bold text-slate-900">
                  {formatINR(gstSummary.reduce((s, g) => s + Number(g.taxable), 0))}
                </td>
                <td className="px-5 py-3 text-right font-bold text-slate-900">
                  {formatINR(gstSummary.reduce((s, g) => s + Number(g.tax) / 2, 0))}
                </td>
                <td className="px-5 py-3 text-right font-bold text-slate-900">
                  {formatINR(gstSummary.reduce((s, g) => s + Number(g.tax) / 2, 0))}
                </td>
                <td className="px-5 py-3 text-right font-bold text-emerald-700">
                  {formatINR(gstSummary.reduce((s, g) => s + Number(g.tax), 0))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Monthly breakdown */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Monthly P&amp;L breakdown</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-2.5 text-left">Month</th>
              <th className="px-5 py-2.5 text-right">Revenue</th>
              <th className="px-5 py-2.5 text-right">Taxable</th>
              <th className="px-5 py-2.5 text-right">Tax Collected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthly.map((m) => (
              <tr key={m.m}>
                <td className="px-5 py-2.5 font-medium text-slate-900">{new Date(`${m.m}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</td>
                <td className="px-5 py-2.5 text-right font-semibold">{formatINR(m.total)}</td>
                <td className="px-5 py-2.5 text-right text-slate-700">{formatINR(m.taxable)}</td>
                <td className="px-5 py-2.5 text-right text-emerald-700">{formatINR(m.tax)}</td>
              </tr>
            ))}
            {monthly.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-400">No data</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm">
        <div className="font-bold text-indigo-900">📋 GSTR-1 Filing Tip</div>
        <p className="mt-1 text-indigo-700">
          For monthly filers, GSTR-1 is due by the 11th of next month and GSTR-3B by the 20th. Use the above summary to file directly on the GST portal.
        </p>
      </div>

      {void formatNumber}
    </div>
  );
}

function PLCard({ label, value, tint, icon }: { label: string; value: string; tint: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-2 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tint} text-lg text-white shadow-md`}>{icon}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

// Suppress unused import warnings if any
void DonutChart;
