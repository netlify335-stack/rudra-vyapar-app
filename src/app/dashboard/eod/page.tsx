import { db } from "@/db";
import { invoices, expenses, eodReports } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";
import { EodForm } from "./EodForm";
import { formatINR, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EodPage() {
  const storeId = (await getActiveStoreId())!;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 1. Fetch Today's Invoices (Sales, Purchases, Returns)
  const todayInvoices = await db.select({
    type: invoices.type,
    paymentMode: invoices.paymentMode,
    splitMode1: invoices.splitPaymentMode1,
    splitMode2: invoices.splitPaymentMode2,
    paidAmount: invoices.paidAmount,
    splitAmt1: invoices.splitAmount1,
    splitAmt2: invoices.splitAmount2,
  }).from(invoices).where(and(eq(invoices.storeId, storeId), eq(invoices.invoiceDate, todayStr)));

  // 2. Fetch Today's Expenses
  const todayExpenses = await db.select({
    paymentMode: expenses.paymentMode,
    amount: expenses.amount,
  }).from(expenses).where(and(eq(expenses.storeId, storeId), eq(expenses.expenseDate, todayStr)));

  let netCashFlow = 0;
  let netUpiFlow = 0;

  // Process invoices
  todayInvoices.forEach(inv => {
    let cash = 0;
    let upi = 0;
    const paid = Number(inv.paidAmount) || 0;

    if (inv.paymentMode === "cash") cash += paid;
    else if (inv.paymentMode === "upi") upi += paid;
    else if (inv.paymentMode === "partial") {
      const sA1 = Number(inv.splitAmt1) || 0;
      const sA2 = Number(inv.splitAmt2) || 0;
      if (inv.splitMode1 === "cash") cash += sA1;
      if (inv.splitMode1 === "upi") upi += sA1;
      if (inv.splitMode2 === "cash") cash += sA2;
      if (inv.splitMode2 === "upi") upi += sA2;
    }

    if (inv.type === "sale") {
      netCashFlow += cash;
      netUpiFlow += upi;
    } else if (inv.type === "purchase") {
      netCashFlow -= cash;
      netUpiFlow -= upi;
    } else if (inv.type === "return") {
      // Assuming return is paid OUT to customer
      netCashFlow -= cash;
      netUpiFlow -= upi;
    }
  });

  // Process expenses
  todayExpenses.forEach(exp => {
    const amt = Number(exp.amount) || 0;
    if (exp.paymentMode === "cash") netCashFlow -= amt;
    else if (exp.paymentMode === "upi") netUpiFlow -= amt;
  });

  // Check if already reconciled today
  const [existingEod] = await db.select().from(eodReports).where(and(eq(eodReports.storeId, storeId), eq(eodReports.reportDate, todayStr))).limit(1);

  // Get previous EODs for history
  const history = await db.select().from(eodReports).where(eq(eodReports.storeId, storeId)).orderBy(desc(eodReports.reportDate)).limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">End-of-Day (EOD) Register 🌙</h1>
        <p className="text-sm text-slate-500">Reconcile physical cash with system expected cash for {formatDate(todayStr)}</p>
      </div>

      {existingEod ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-600">✓</div>
            <div>
              <h3 className="font-bold text-emerald-900">EOD Reconciled for Today</h3>
              <p className="text-sm text-emerald-700">Cash Discrepancy: {formatINR(Number(existingEod.discrepancy))}</p>
            </div>
          </div>
        </div>
      ) : (
        <EodForm todayStr={todayStr} netCashFlow={netCashFlow} netUpiFlow={netUpiFlow} />
      )}

      {history.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm mt-8">
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-bold text-slate-900">Recent EOD History</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-right">Expected Cash</th>
                <th className="px-5 py-3 text-right">Actual Cash</th>
                <th className="px-5 py-3 text-right">Discrepancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map(h => {
                const disc = Number(h.discrepancy);
                return (
                  <tr key={h.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{formatDate(h.reportDate)}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{formatINR(Number(h.expectedCash))}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{formatINR(Number(h.actualCash))}</td>
                    <td className={`px-5 py-3 text-right font-bold ${disc === 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatINR(disc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
