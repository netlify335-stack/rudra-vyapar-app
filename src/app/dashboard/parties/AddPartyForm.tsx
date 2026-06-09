"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getLocalDb } from "@/db/local";
import { parties } from "@/db/schema";

export function AddPartyForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"customer" | "supplier">("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name) return;
    setSaving(true);
    try {
      const db = await getLocalDb();
      await db.insert(parties).values({
        storeId,
        type,
        name,
        phone: phone || null,
        gstin: gstin || null,
        city: city || null,
      });

      setName(""); setPhone(""); setGstin(""); setCity("");
      setOpen(false);
      // Removed router.refresh() because Client Component will re-fetch automatically if we trigger a re-render or if useLocalDbQuery polls, but actually useLocalDbQuery doesn't poll.
      // To force a refresh of useLocalDbQuery, we can reload or use a simpler trick.
      // For now, let's just do a window.location.reload() or router.refresh() if needed.
      // Actually router.refresh() doesn't re-run Client Components' data fetching unless it's Server data.
      // Let's just do window.location.reload() to be safe and simple for this offline refactor.
      window.location.reload();
    } catch(e) {
      alert("Failed to save party");
      console.error(e);
    } finally { setSaving(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">
        + Add Party
      </button>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">Add new party</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(["customer", "supplier"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase ${type === t ? "bg-white shadow text-orange-700" : "text-slate-500"}`}>{t}</button>
          ))}
        </div>
        <Input placeholder="Name *" value={name} onChange={setName} />
        <Input placeholder="Phone (+91)" value={phone} onChange={setPhone} />
        <Input placeholder="GSTIN (optional)" value={gstin} onChange={setGstin} />
        <Input placeholder="City" value={city} onChange={setCity} />
      </div>
      <button
        onClick={save}
        disabled={!name || saving}
        className="mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Party"}
      </button>
    </div>
  );
}

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:bg-white"
    />
  );
}
