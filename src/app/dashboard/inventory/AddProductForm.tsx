"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GST_RATES = [0, 5, 12, 18, 28];

export function AddProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Grocery",
    hsnCode: "",
    unit: "PCS",
    purchasePrice: "",
    sellingPrice: "",
    mrp: "",
    gstRate: 18,
    minStockLevel: "10",
    currentStock: "0",
    trackExpiry: false,
    description: "",
    expiryPeriod: "none",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name || !form.sellingPrice) return;
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setOpen(false);
        setForm({ ...form, name: "", sellingPrice: "", purchasePrice: "", mrp: "", currentStock: "0", description: "", expiryPeriod: "none" });
        router.refresh();
      } else alert(data.error || "Failed");
    } finally { setSaving(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">
        + Add Product
      </button>
    );
  }

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">Add new product</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Product name *">
          <input value={form.name} onChange={(e) => update("name", e.target.value)} className={INPUT} />
        </Field>
        <Field label="Description">
          <input value={form.description} onChange={(e) => update("description", e.target.value)} className={INPUT} placeholder="Enter description..." />
        </Field>
        <Field label="Category"><input value={form.category} onChange={(e) => update("category", e.target.value)} className={INPUT} /></Field>
        <Field label="HSN Code"><input value={form.hsnCode} onChange={(e) => update("hsnCode", e.target.value)} className={INPUT} /></Field>
        <Field label="Unit"><input value={form.unit} onChange={(e) => update("unit", e.target.value)} className={INPUT} /></Field>
        <Field label="Purchase Price"><input type="number" value={form.purchasePrice} onChange={(e) => update("purchasePrice", e.target.value)} className={INPUT} /></Field>
        <Field label="Selling Price *"><input type="number" value={form.sellingPrice} onChange={(e) => update("sellingPrice", e.target.value)} className={INPUT} /></Field>
        <Field label="MRP"><input type="number" value={form.mrp} onChange={(e) => update("mrp", e.target.value)} className={INPUT} /></Field>
        <Field label="GST %">
          <select value={form.gstRate} onChange={(e) => update("gstRate", Number(e.target.value))} className={INPUT}>
            {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
        </Field>
        <Field label="Min Stock"><input type="number" value={form.minStockLevel} onChange={(e) => update("minStockLevel", e.target.value)} className={INPUT} /></Field>
        <Field label="Opening Stock"><input type="number" value={form.currentStock} onChange={(e) => update("currentStock", e.target.value)} className={INPUT} /></Field>
        <Field label="Expiry Period">
          <select value={form.expiryPeriod} onChange={(e) => update("expiryPeriod", e.target.value)} className={INPUT}>
            <option value="none">No Expiry</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">1 year</option>
            <option value="24">2 years</option>
            <option value="48">4 years</option>
            <option value="60">5 years</option>
            <option value="72">6 years</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" checked={form.trackExpiry || form.expiryPeriod !== "none"} onChange={(e) => update("trackExpiry", e.target.checked)} />
          Track expiry (pharmacy)
        </label>
      </div>
      <button onClick={save} disabled={saving || !form.name || !form.sellingPrice} className="mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50">
        {saving ? "Saving..." : "Save Product"}
      </button>
    </div>
  );
}

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold text-slate-600">{label}</div>
      {children}
    </div>
  );
}
