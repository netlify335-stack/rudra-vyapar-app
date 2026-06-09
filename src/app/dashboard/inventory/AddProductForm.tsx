"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { getLocalDb } from "@/db/local";
import { products, productUnits, productExtras, productVariants, batches } from "@/db/schema";

export function AddProductForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    hsnCode: "",
    unit: "PCS",
    purchasePrice: "",
    sellingPrice: "",
    gstRate: 18,
    minStockLevel: "10",
    currentStock: "0",
    rackLocation: "",
    trackExpiry: false,
    description: "",
    expiryPeriod: "none",
  });
  
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [storeExtras, setStoreExtras] = useState<any[]>([]);

  // Multi-Units
  const [units, setUnits] = useState<{ unitName: string; conversionRate: number; price: string }[]>([]);

  // Variants (Combos)
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [diffPrices, setDiffPrices] = useState({ color: false, size: false, material: false });
  
  // Stored combo prices/stocks so we don't lose them when selecting a new color
  const [variantData, setVariantData] = useState<Record<string, { price: string; currentStock: string; active: boolean }>>({});

  useEffect(() => {
    if (open) {
      // For Categories and StoreExtras, we should also probably query local DB but we can just use fetch for them if they aren't refactored yet, or query local DB.
      // Wait, let's query local DB!
      getLocalDb().then(async (db) => {
        const { categories: cats, storeExtras: extras } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");
        
        const c = await db.select().from(cats).where(eq(cats.storeId, storeId));
        setCategories(c);
        
        const e = await db.select().from(extras).where(eq(extras.storeId, storeId));
        setStoreExtras(e);
      }).catch(console.error);
    }
  }, [open, storeId]);

  // Derived Extras
  const availableColors = storeExtras.filter(e => e.type === "color");
  const availableSizes = storeExtras.filter(e => e.type === "size");
  const availableMaterials = storeExtras.filter(e => e.type === "material");

  // Generate Combos whenever selection or diffPrices change
  const combos = useMemo(() => {
    const arrColor = diffPrices.color && selectedColors.length > 0 ? selectedColors : [null];
    const arrSize = diffPrices.size && selectedSizes.length > 0 ? selectedSizes : [null];
    const arrMaterial = diffPrices.material && selectedMaterials.length > 0 ? selectedMaterials : [null];

    const result = [];
    for (const cId of arrColor) {
      for (const sId of arrSize) {
        for (const mId of arrMaterial) {
          if (cId === null && sId === null && mId === null) continue; // no combination
          
          const key = `${cId || 'none'}-${sId || 'none'}-${mId || 'none'}`;
          const cName = cId ? availableColors.find(x => x.id === cId)?.name : null;
          const sName = sId ? availableSizes.find(x => x.id === sId)?.name : null;
          const mName = mId ? availableMaterials.find(x => x.id === mId)?.name : null;
          
          const nameParts = [cName, sName, mName].filter(Boolean);
          const label = nameParts.length > 0 ? nameParts.join(" + ") : "Default Variant";

          result.push({ key, cId, sId, mId, label });
        }
      }
    }
    return result;
  }, [selectedColors, selectedSizes, selectedMaterials, diffPrices, availableColors, availableSizes, availableMaterials]);


  // When combos change, initialize variantData if not present
  useEffect(() => {
    setVariantData(prev => {
      const next = { ...prev };
      combos.forEach(c => {
        if (!next[c.key]) {
          next[c.key] = { price: form.sellingPrice || "0", currentStock: "0", active: true };
        }
      });
      return next;
    });
  }, [combos, form.sellingPrice]);


  async function save() {
    if (!form.name || !form.sellingPrice) return;
    setSaving(true);
    
    const activeVariants = combos
      .filter(c => variantData[c.key]?.active)
      .map(c => ({
        sizeId: c.sId,
        colorId: c.cId,
        materialId: c.mId,
        price: variantData[c.key].price,
        currentStock: variantData[c.key].currentStock,
      }));

    const allExtras = [...selectedColors, ...selectedSizes, ...selectedMaterials];
    const hasVariants = activeVariants.length > 0;

    try {
      const db = await getLocalDb();
      const [row] = await db.insert(products).values({
        storeId,
        name: form.name,
        category: form.category || null,
        hsnCode: form.hsnCode || null,
        unit: form.unit || "PCS",
        purchasePrice: form.purchasePrice || "0",
        sellingPrice: form.sellingPrice || "0",
        gstRate: String(form.gstRate ?? 18),
        minStockLevel: form.minStockLevel || "0",
        currentStock: hasVariants ? "0" : (form.currentStock || "0"),
        rackLocation: form.rackLocation || null,
        trackExpiry: !!form.trackExpiry || (form.expiryPeriod !== undefined && form.expiryPeriod !== "none"),
        description: form.description || null,
        hasVariants: !!hasVariants,
      }).returning();

      if (units.length > 0) {
        await db.insert(productUnits).values(
          units.map(u => ({
            productId: row.id,
            unitName: u.unitName,
            conversionRate: String(u.conversionRate),
            price: u.price || null,
          }))
        );
      }

      if (allExtras.length > 0) {
        await db.insert(productExtras).values(
          allExtras.map(extraId => ({
            productId: row.id,
            extraId,
          }))
        );
      }

      if (hasVariants) {
        await db.insert(productVariants).values(
          activeVariants.map(v => ({
            productId: row.id,
            sizeId: v.sizeId || null,
            colorId: v.colorId || null,
            materialId: v.materialId || null,
            price: v.price || form.sellingPrice || "0",
            currentStock: v.currentStock || "0",
          }))
        );
      }

      if (!hasVariants && form.expiryPeriod && form.expiryPeriod !== "none" && Number(form.currentStock || "0") > 0) {
        const months = Number(form.expiryPeriod);
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + months);
        
        await db.insert(batches).values({
          storeId,
          productId: row.id,
          batchNo: `AUTO-${Date.now().toString().slice(-6)}`,
          mfgDate: new Date().toISOString().slice(0, 10),
          expiryDate: expiryDate.toISOString().slice(0, 10),
          quantity: form.currentStock || "0",
        });
      }

      setOpen(false);
      setForm({ ...form, name: "", sellingPrice: "", purchasePrice: "", currentStock: "0", description: "", expiryPeriod: "none", rackLocation: "" });
      setUnits([]);
      setSelectedColors([]);
      setSelectedSizes([]);
      setSelectedMaterials([]);
      setDiffPrices({ color: false, size: false, material: false });
      setVariantData({});
      window.location.reload();
    } catch(e) {
      alert("Failed to save product");
      console.error(e);
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

  function toggleArray(arr: string[], setArr: any, id: string) {
    if (arr.includes(id)) setArr(arr.filter(x => x !== id));
    else setArr([...arr, id]);
  }

  const hasVariants = combos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-bold text-slate-900">Add New Product</h3>
          <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Field label="Product name *">
              <input value={form.name} onChange={(e) => update("name", e.target.value)} className={INPUT} />
            </Field>
          </div>
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
          <Field label="Base Unit (e.g. PCS)"><input value={form.unit} onChange={(e) => update("unit", e.target.value)} className={INPUT} /></Field>
          <Field label="Purchase Price"><input type="number" value={form.purchasePrice} onChange={(e) => update("purchasePrice", e.target.value)} className={INPUT} /></Field>
          <Field label="Base Selling Price *"><input type="number" value={form.sellingPrice} onChange={(e) => update("sellingPrice", e.target.value)} className={INPUT} /></Field>
          
          <Field label="GST %">
            <input type="number" value={form.gstRate} onChange={(e) => update("gstRate", Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="Min Stock Alert"><input type="number" value={form.minStockLevel} onChange={(e) => update("minStockLevel", e.target.value)} className={INPUT} /></Field>
          {!hasVariants && (
            <Field label="Opening Stock (Base Unit)"><input type="number" value={form.currentStock} onChange={(e) => update("currentStock", e.target.value)} className={INPUT} /></Field>
          )}
        </div>

        {/* Multi Units */}
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-bold text-slate-800 mb-2">Multi-Unit Support</h4>
          {units.map((u, i) => (
            <div key={i} className="flex gap-2 mb-2 items-end">
              <Field label="Unit Name"><input value={u.unitName} onChange={e => { const n = [...units]; n[i].unitName = e.target.value; setUnits(n); }} className={INPUT} placeholder="e.g. Box" /></Field>
              <Field label={`Equals how many ${form.unit || 'base units'}?`}><input type="number" value={u.conversionRate} onChange={e => { const n = [...units]; n[i].conversionRate = Number(e.target.value); setUnits(n); }} className={INPUT} placeholder="10" /></Field>
              <Field label="Custom Price (Optional)"><input type="number" value={u.price} onChange={e => { const n = [...units]; n[i].price = e.target.value; setUnits(n); }} className={INPUT} placeholder="Leave blank to auto-calc" /></Field>
              <button onClick={() => setUnits(units.filter((_, idx) => idx !== i))} className="p-2 mb-1 text-rose-500 hover:text-rose-700"><Trash2 className="h-5 w-5" /></button>
            </div>
          ))}
          <button onClick={() => setUnits([...units, { unitName: "", conversionRate: 1, price: "" }])} className="text-xs font-bold text-orange-600 hover:underline">+ Add Unit Conversion</button>
        </div>

        {/* Extras & Variants */}
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-bold text-slate-800 mb-2">Manage Extras (Sizes, Colors, Materials)</h4>
          <p className="text-xs text-slate-500 mb-4">Select the properties available for this product. Check "Different Prices" to generate combinations with unique pricing and stock.</p>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Colors */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex justify-between items-center mb-2 border-b pb-2">
                <span className="font-semibold text-sm">Colors</span>
                <label className="text-[10px] flex items-center gap-1 font-bold text-slate-600"><input type="checkbox" checked={diffPrices.color} onChange={e => setDiffPrices({...diffPrices, color: e.target.checked})} /> Diff Prices</label>
              </div>
              <div className="flex flex-wrap gap-1">
                {availableColors.map(c => (
                  <button key={c.id} onClick={() => toggleArray(selectedColors, setSelectedColors, c.id)} className={`px-2 py-1 text-[11px] rounded border ${selectedColors.includes(c.id) ? "bg-indigo-100 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-600"}`}>{c.name}</button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex justify-between items-center mb-2 border-b pb-2">
                <span className="font-semibold text-sm">Sizes</span>
                <label className="text-[10px] flex items-center gap-1 font-bold text-slate-600"><input type="checkbox" checked={diffPrices.size} onChange={e => setDiffPrices({...diffPrices, size: e.target.checked})} /> Diff Prices</label>
              </div>
              <div className="flex flex-wrap gap-1">
                {availableSizes.map(c => (
                  <button key={c.id} onClick={() => toggleArray(selectedSizes, setSelectedSizes, c.id)} className={`px-2 py-1 text-[11px] rounded border ${selectedSizes.includes(c.id) ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-600"}`}>{c.name}</button>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex justify-between items-center mb-2 border-b pb-2">
                <span className="font-semibold text-sm">Materials</span>
                <label className="text-[10px] flex items-center gap-1 font-bold text-slate-600"><input type="checkbox" checked={diffPrices.material} onChange={e => setDiffPrices({...diffPrices, material: e.target.checked})} /> Diff Prices</label>
              </div>
              <div className="flex flex-wrap gap-1">
                {availableMaterials.map(c => (
                  <button key={c.id} onClick={() => toggleArray(selectedMaterials, setSelectedMaterials, c.id)} className={`px-2 py-1 text-[11px] rounded border ${selectedMaterials.includes(c.id) ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-600"}`}>{c.name}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Combo Table */}
          {combos.length > 0 && (
            <div className="mt-6">
              <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">Variant Combinations</h5>
              <table className="w-full text-left text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Combination</th>
                    <th className="px-3 py-2 w-32">Price (₹)</th>
                    <th className="px-3 py-2 w-32">Stock (Base)</th>
                    <th className="px-3 py-2 w-16 text-center">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {combos.map(c => {
                    const data = variantData[c.key] || { price: "0", currentStock: "0", active: true };
                    return (
                      <tr key={c.key} className={data.active ? "bg-white" : "bg-slate-50 opacity-50"}>
                        <td className="px-3 py-2 font-medium">{c.label}</td>
                        <td className="px-3 py-2"><input type="number" value={data.price} onChange={e => setVariantData({...variantData, [c.key]: {...data, price: e.target.value}})} className="w-full rounded border border-slate-200 p-1 text-sm outline-none" disabled={!data.active} /></td>
                        <td className="px-3 py-2"><input type="number" value={data.currentStock} onChange={e => setVariantData({...variantData, [c.key]: {...data, currentStock: e.target.value}})} className="w-full rounded border border-slate-200 p-1 text-sm outline-none" disabled={!data.active} /></td>
                        <td className="px-3 py-2 text-center"><input type="checkbox" checked={data.active} onChange={e => setVariantData({...variantData, [c.key]: {...data, active: e.target.checked}})} className="h-4 w-4" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button onClick={() => setOpen(false)} className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving || !form.name || !form.sellingPrice} className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50 transition hover:scale-[1.02]">
            {saving ? "Saving..." : "Save Product"}
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
