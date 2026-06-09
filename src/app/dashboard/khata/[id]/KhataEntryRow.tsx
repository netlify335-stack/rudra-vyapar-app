"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR, formatDate } from "@/lib/format";
import { getLocalDb } from "@/db/local";
import { parties, khataEntries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
export function KhataEntryRow({ entry }: { entry: any }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    amount: entry.amount,
    type: entry.type,
    notes: entry.notes || "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      const db = await getLocalDb();
      const oldDelta = entry.type === "credit" ? -Number(entry.amount) : Number(entry.amount);
      const newDelta = form.type === "credit" ? Number(form.amount) : -Number(form.amount);
      const netDelta = oldDelta + newDelta;

      await db
        .update(parties)
        .set({ outstandingBalance: sql`${parties.outstandingBalance} + ${netDelta}` })
        .where(eq(parties.id, entry.partyId));

      await db
        .update(khataEntries)
        .set({
          amount: String(form.amount),
          type: form.type,
          notes: form.notes,
        })
        .where(eq(khataEntries.id, entry.id));

      setEditing(false);
      window.location.reload();
    } catch (e) {
      alert("Failed to update");
      console.error(e);
    } finally { setSaving(false); }
  }

  async function del() {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    setSaving(true);
    try {
      const db = await getLocalDb();
      const delta = entry.type === "credit" ? -Number(entry.amount) : Number(entry.amount);

      await db
        .update(parties)
        .set({ outstandingBalance: sql`${parties.outstandingBalance} + ${delta}` })
        .where(eq(parties.id, entry.partyId));

      await db.delete(khataEntries).where(eq(khataEntries.id, entry.id));

      window.location.reload();
    } catch (e) {
      alert("Failed to delete");
      console.error(e);
    } finally { setSaving(false); }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-3 bg-slate-50 p-4 shadow-inner">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded border px-2 py-1 text-sm outline-none">
          <option value="credit">Udhaar (Given)</option>
          <option value="debit">Advance / Jama</option>
        </select>
        <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-24 rounded border px-2 py-1 text-sm outline-none" />
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="flex-1 rounded border px-2 py-1 text-sm outline-none" />
        <button onClick={save} disabled={saving} className="rounded bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm disabled:opacity-50">Save</button>
        <button onClick={() => setEditing(false)} className="rounded px-3 py-1 text-xs text-slate-500 hover:bg-slate-200">Cancel</button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-full text-base ${entry.type === "credit" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
          {entry.type === "credit" ? "↑" : "↓"}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800">{entry.type === "credit" ? "Udhaar (Given)" : "Advance / Jama (Received)"}</div>
          <div className="text-[11px] text-slate-500">{formatDate(entry.entryDate)} · {entry.notes || "—"}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button onClick={() => setEditing(true)} className="text-xs font-semibold text-orange-600 hover:text-orange-700">Edit</button>
          <button onClick={del} disabled={saving} className="text-xs font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-50">Delete</button>
        </div>
        <div className={`text-base font-bold ${entry.type === "credit" ? "text-rose-600" : "text-emerald-600"}`}>
          {entry.type === "credit" ? "+" : "−"} {formatINR(entry.amount)}
        </div>
      </div>
    </div>
  );
}
