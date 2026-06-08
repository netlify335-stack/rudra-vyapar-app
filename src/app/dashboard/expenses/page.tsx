import { db } from "@/db";
import { expenses } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";
import { formatINR, formatDate } from "@/lib/format";
import { AddExpenseForm } from "./AddExpenseForm";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const storeId = (await getActiveStoreId())!;
  const list = await db.select().from(expenses).where(eq(expenses.storeId, storeId)).orderBy(desc(expenses.expenseDate));
  const total = list.reduce((s, e) => s + Number(e.amount), 0);

  // by category
  const byCat = await db
    .select({ cat: expenses.category, total: sql<string>`sum(${expenses.amount})` })
    .from(expenses)
    .where(eq(expenses.storeId, storeId))
    .groupBy(expenses.category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Expenses 💸</h1>
        <p className="text-sm text-slate-500">Total spent: {formatINR(total)}</p>
      </div>

      <AddExpenseForm />

      {byCat.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {byCat.map((c) => (
            <div key={c.cat} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.cat}</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{formatINR(c.total)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold">All expenses</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-2.5 text-left">Date</th>
              <th className="px-5 py-2.5 text-left">Category</th>
              <th className="px-5 py-2.5 text-left">Description</th>
              <th className="px-5 py-2.5 text-left">Payment</th>
              <th className="px-5 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-5 py-2.5 text-slate-600">{formatDate(e.expenseDate)}</td>
                <td className="px-5 py-2.5 font-medium text-slate-800">{e.category}</td>
                <td className="px-5 py-2.5 text-slate-600">{e.description}</td>
                <td className="px-5 py-2.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-700">{e.paymentMode}</span>
                </td>
                <td className="px-5 py-2.5 text-right font-bold text-rose-600">{formatINR(e.amount)}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-400">No expenses yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
