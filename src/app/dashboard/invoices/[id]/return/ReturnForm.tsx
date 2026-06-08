"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";

export function ReturnForm({
  invoiceId,
  invoiceNo,
  partyName,
  isSale,
  items,
}: {
  invoiceId: string;
  invoiceNo: string;
  partyName: string | null;
  isSale: boolean;
  items: {
    id: string;
    productId: string;
    variantId: string | null;
    productName: string;
    variantName: string | null;
    hsnCode: string | null;
    unit: string | null;
    rate: string;
    quantity: string;
    discountPercent: string;
    gstRate: string;
  }[];
}) {
  const router = useRouter();
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMode, setRefundMode] = useState<"cash" | "upi" | "credit">("credit");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Calculate return totals
  let totalRefund = 0;
  items.forEach((it) => {
    const qty = returnQtys[it.id] || 0;
    if (qty > 0) {
      const gross = Number(it.rate) * qty;
      const disc = gross * (Number(it.discountPercent) / 100);
      const tx = gross - disc;
      const tax = tx * (Number(it.gstRate) / 100);
      totalRefund += (tx + tax);
    }
  });

  async function handleSubmit() {
    if (totalRefund <= 0) return alert("Select at least one item to return.");
    setSubmitting(true);
    
    const payload = {
      refundMode,
      notes,
      returnItems: items.map(it => ({
        invoiceItemId: it.id,
        productId: it.productId,
        variantId: it.variantId,
        name: it.productName,
        variantName: it.variantName,
        hsnCode: it.hsnCode,
        unit: it.unit || "PCS",
        rate: Number(it.rate),
        returnQty: returnQtys[it.id] || 0,
        discountPercent: Number(it.discountPercent),
        gstRate: Number(it.gstRate),
      })).filter(x => x.returnQty > 0)
    };

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      router.push(`/dashboard/invoices/${data.invoiceId}`);
    } catch (err) {
      alert((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">
          Process Return for {invoiceNo}
        </h1>
        <p className="text-sm text-slate-500">
          {isSale ? "Customer returning items" : "Returning items to supplier"} • Party: {partyName || "Cash Party"}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-right">Billed Qty</th>
              <th className="px-3 py-2 text-right">Return Qty</th>
              <th className="px-3 py-2 text-right">Refund Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => {
              const maxQty = Number(it.quantity);
              const rQty = returnQtys[it.id] || 0;
              const gross = Number(it.rate) * rQty;
              const disc = gross * (Number(it.discountPercent) / 100);
              const tx = gross - disc;
              const tax = tx * (Number(it.gstRate) / 100);
              const refAmt = tx + tax;

              return (
                <tr key={it.id}>
                  <td className="px-3 py-4">
                    <div className="font-semibold text-slate-900">{it.productName}</div>
                    {it.variantName && <div className="text-xs text-slate-500">{it.variantName}</div>}
                    <div className="text-xs text-slate-500">Rate: {formatINR(Number(it.rate))}</div>
                  </td>
                  <td className="px-3 py-4 text-right text-slate-700">{maxQty} {it.unit}</td>
                  <td className="px-3 py-4 text-right">
                    <input
                      type="number"
                      min="0"
                      max={maxQty}
                      step="any"
                      value={rQty || ""}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val < 0) val = 0;
                        if (val > maxQty) val = maxQty;
                        setReturnQtys({ ...returnQtys, [it.id]: val });
                      }}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-right font-medium outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="px-3 py-4 text-right font-bold text-slate-900">
                    {formatINR(refAmt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Refund Settlement</label>
          <select
            value={refundMode}
            onChange={(e) => setRefundMode(e.target.value as any)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white"
          >
            <option value="credit">Settle in Udhaari (Credit Note)</option>
            <option value="cash">Refunded via Cash</option>
            <option value="upi">Refunded via UPI</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Notes (Optional)</label>
          <input
            type="text"
            placeholder="Reason for return..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-6 shadow-lg">
        <div>
          <div className="text-sm font-medium text-slate-300">Total Refund</div>
          <div className="text-2xl font-bold text-white">{formatINR(totalRefund)}</div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || totalRefund <= 0}
          className="rounded-xl bg-indigo-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Process Return"}
        </button>
      </div>
    </div>
  );
}
