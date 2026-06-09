"use client";
import { useState } from "react";
import { getLocalDb } from "@/db/local";
import { expenses } from "@/db/schema";

const CATEGORIES = ["Rent", "Electricity", "Transport", "Staff Salary", "Packing", "Internet/Mobile", "Maintenance", "Misc"];

export function AddExpenseForm({ storeId, onSuccess }: { storeId: string, onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!amount) return;
    setSaving(true);
    try {
      const db = await getLocalDb();
      await db.insert(expenses).values({
        storeId,
        category,
        amount: String(Number(amount)),
        description,
        paymentMode,
        expenseDate: new Date().toISOString().split("T")[0],
      });
      setAmount(""); setDescription("");
      setOpen(false);
      onSuccess();
    } finally { setSaving(false); }
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">+ Add Expense</button>;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">Record expense</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" placeholder="Amount ₹" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none" />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none md:col-span-2" />
        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank">Bank</option>
          <option value="card">Card</option>
        </select>
        <button onClick={save} disabled={!amount || saving} className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2 text-sm font-bold text-white shadow-md md:col-span-3 disabled:opacity-50">
          {saving ? "Saving..." : "Save Expense"}
        </button>
      </div>
    </div>
  );
}
