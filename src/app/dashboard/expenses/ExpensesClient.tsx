// @ts-nocheck
"use client";

import { useLocalDbQuery } from "@/hooks/useLocalDb";
import { expenses } from "@/db/schema";
import { formatINR, formatDate } from "@/lib/format";
import { AddExpenseForm } from "./AddExpenseForm";
import { ExpenseFilter } from "./ExpenseFilter";
import { and, desc, eq, sql, gte, lte } from "drizzle-orm";
import { useState } from "react";

export function ExpensesClient({
  storeId,
  searchParams,
}: {
  storeId: string;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const dateFilter = (searchParams.dateFilter as string) || "all";
  const start = (searchParams.start as string) || "";
  const end = (searchParams.end as string) || "";
  const category = (searchParams.category as string) || "all";
  const mode = (searchParams.mode as string) || "all";

  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error } = useLocalDbQuery(
    async (db) => {
      let dateCondition = undefined;
      if (dateFilter === "today") {
        const today = new Date().toISOString().split("T")[0];
        dateCondition = eq(expenses.expenseDate, today);
      } else if (dateFilter === "yesterday") {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        dateCondition = eq(expenses.expenseDate, yest.toISOString().split("T")[0]);
      } else if (dateFilter === "custom" && start && end) {
        dateCondition = and(
          gte(expenses.expenseDate, start),
          lte(expenses.expenseDate, end)
        );
      }

      const list = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.storeId, storeId),
            dateCondition,
            category !== "all" ? eq(expenses.category, category) : undefined,
            mode !== "all" ? eq(expenses.paymentMode, mode) : undefined
          )
        )
        .orderBy(desc(expenses.expenseDate));

      const byCat = await db
        .select({ cat: expenses.category, total: sql<string>`sum(${expenses.amount})` })
        .from(expenses)
        .where(eq(expenses.storeId, storeId))
        .groupBy(expenses.category);

      return { list, byCat };
    },
    [storeId, dateFilter, start, end, category, mode, refreshKey]
  );

  if (loading) return <div>Loading expenses...</div>;
  if (error) return <div className="text-red-500">Error loading expenses</div>;

  const list = data?.list || [];
  const byCat = data?.byCat || [];

  let sumTotal = 0, sumPaid = 0, sumDue = 0;
  list.forEach(e => {
    const amt = Number(e.amount) || 0;
    sumTotal += amt;
    if (e.paymentMode === "credit") sumDue += amt;
    else sumPaid += amt;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Expenses 💸</h1>
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

      <AddExpenseForm storeId={storeId} onSuccess={() => setRefreshKey(k => k + 1)} />

      {byCat.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {byCat.map((c: any) => (
            <div key={c.cat} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.cat}</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{formatINR(c.total)}</div>
            </div>
          ))}
        </div>
      )}

      <ExpenseFilter
        currentDateFilter={dateFilter}
        currentStart={start}
        currentEnd={end}
        currentCategory={category}
        currentMode={mode}
      />

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
            {list.map((e: any) => (
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
