"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { getLocalDb } from "@/db/local";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

const GST_RATES = [0, 5, 12, 18, 28];

export function EditProductModal({ product, storeId, onClose }: { product: any; storeId: string; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product.name || "",
    category: product.category || "Grocery",
    hsnCode: product.hsnCode || "",
    unit: product.unit || "PCS",
    purchasePrice: product.purchasePrice || "",
    sellingPrice: product.sellingPrice || "",
    gstRate: Number(product.gstRate) || 18,
    minStockLevel: product.minStockLevel || "10",
    currentStock: product.currentStock || "0",
    rackLocation: product.rackLocation || "",
    trackExpiry: product.trackExpiry || false,
    description: product.description || "",
    expiryPeriod: "none",
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    getLocalDb().then(async (db) => {
      const { categories: cats } = await import("@/db/schema");
      const c = await db.select().from(cats).where(eq(cats.storeId, storeId));
      setCategories(c);
    }).catch(console.error);
  }, [storeId]);

  async function save() {
    if (!form.name || !form.sellingPrice) return;
    setSaving(true);
    try {
      const db = await getLocalDb();
      await db.update(products).set({
        name: form.name,
        category: form.category || null,
        hsnCode: form.hsnCode || null,
        unit: form.unit || "PCS",
        purchasePrice: form.purchasePrice || "0",
        sellingPrice: form.sellingPrice || "0",
        gstRate: String(form.gstRate ?? 18),
        minStockLevel: form.minStockLevel || "0",
        currentStock: form.currentStock || "0",
        rackLocation: form.rackLocation || null,
        trackExpiry: form.trackExpiry,
        description: form.description || null,
      }).where(eq(products.id, product.id));

      onClose();
      window.location.reload();
    } catch(e) {
      alert("Failed to save changes");
      console.error(e);
    } finally { setSaving(false); }
  }

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Edit Product: {product.name}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Product name *">
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Description">
            <input value={form.description} onChange={(e) => update("description", e.target.value)} className={INPUT} placeholder="Enter description..." />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => update("category", e.target.value)} className={INPUT}>
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Rack Location">
            <input value={form.rackLocation} onChange={(e) => update("rackLocation", e.target.value)} className={INPUT} placeholder="e.g. A-3" />
          </Field>
          <Field label="HSN Code"><input value={form.hsnCode} onChange={(e) => update("hsnCode", e.target.value)} className={INPUT} /></Field>
          <Field label="Unit"><input value={form.unit} onChange={(e) => update("unit", e.target.value)} className={INPUT} /></Field>
          <Field label="Purchase Price"><input type="number" value={form.purchasePrice} onChange={(e) => update("purchasePrice", e.target.value)} className={INPUT} /></Field>
          <Field label="Selling Price *"><input type="number" value={form.sellingPrice} onChange={(e) => update("sellingPrice", e.target.value)} className={INPUT} /></Field>
          <Field label="GST %">
            <input type="number" value={form.gstRate} onChange={(e) => update("gstRate", Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="Min Stock"><input type="number" value={form.minStockLevel} onChange={(e) => update("minStockLevel", e.target.value)} className={INPUT} /></Field>
          <Field label="Current Stock"><input type="number" value={form.currentStock} onChange={(e) => update("currentStock", e.target.value)} className={INPUT} /></Field>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" checked={form.trackExpiry} onChange={(e) => update("trackExpiry", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
            Track expiry (pharmacy)
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving || !form.name || !form.sellingPrice} className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50 transition hover:scale-[1.02]">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
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
