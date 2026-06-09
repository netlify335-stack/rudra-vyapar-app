"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";

import { getLocalDb } from "@/db/local";
import { inventoryAdjustments, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export function AdjustStockModal({
  product,
  storeId,
  onClose,
  onAdjusted,
}: {
  product: {
    id: string;
    name: string;
    currentStock: string;
    unit: string;
  };
  storeId: string;
  onClose: () => void;
  onAdjusted: () => void;
}) {
  const [type, setType] = useState<"damage" | "loss" | "correction" | "addition">("damage");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quantity || Number(quantity) === 0) return alert("Enter a valid quantity");
    
    setLoading(true);
    try {
      let actualQty = Number(quantity);
      if (type === "damage" || type === "loss") {
        actualQty = -Math.abs(Number(quantity));
      }

      const db = await getLocalDb();
      await db.transaction(async (tx) => {
        await tx.insert(inventoryAdjustments).values({
          storeId,
          productId: product.id,
          type,
          quantity: String(actualQty),
          reason,
        });

        await tx.update(products)
          .set({ currentStock: sql`${products.currentStock} + ${actualQty}` })
          .where(eq(products.id, product.id));
      });

      onAdjusted();
      onClose();
    } catch (err) {
      alert((err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Adjust Stock</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="mb-6 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="font-semibold text-slate-900">{product.name}</div>
          <div className="text-slate-500">Current Stock: <span className="font-bold text-slate-700">{formatNumber(Number(product.currentStock))} {product.unit}</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Adjustment Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="damage">Damage (Deduct)</option>
              <option value="loss">Loss / Theft (Deduct)</option>
              <option value="addition">Found / Addition (Add)</option>
              <option value="correction">Manual Correction</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</label>
            <input
              type="number"
              min="0.001"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder={`e.g. 5 ${product.unit}`}
            />
            {type === "correction" && <p className="mt-1 text-xs text-slate-500">Use negative for deduction, positive for addition.</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Reason / Notes</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="e.g. Mice ate the packet"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Confirm Adjustment"}
          </button>
        </form>
      </div>
    </div>
  );
}
