// @ts-nocheck
"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import { getLocalDb } from "@/db/local";
import { invoices, invoiceItems, parties, products, stores, khataEntries, productVariants } from "@/db/schema";
import { calcInvoiceTotals, round2 } from "@/lib/gst";
import { eq, sql } from "drizzle-orm";

export function ReturnForm({
  invoiceId,
  invoiceNo,
  partyName,
  partyId,
  isSale,
  origType,
  storeId,
  items,
}: {
  invoiceId: string;
  invoiceNo: string;
  partyName: string | null;
  partyId: string | null;
  isSale: boolean;
  origType: string;
  storeId: string;
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
      const db = await getLocalDb();

      const totals = calcInvoiceTotals({
        items: payload.returnItems.map((it) => ({
          rate: it.rate,
          quantity: it.returnQty,
          discountPercent: it.discountPercent ?? 0,
          gstRate: it.gstRate,
        })),
        isIgst: false,
      });

      const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
      const next = (store?.invoiceCounter ?? 1);
      const prefix = store?.invoicePrefix ?? "INV";
      const returnNo = `${prefix}-RTN-${String(next).padStart(5, "0")}`;
      await db.update(stores).set({ invoiceCounter: next + 1 }).where(eq(stores.id, storeId));

      let refundAmount = 0;
      let creditAmount = 0;

      if (refundMode === "credit") {
        creditAmount = totals.totalAmount;
      } else {
        refundAmount = totals.totalAmount;
      }

      const [retInv] = await db
        .insert(invoices)
        .values({
          storeId,
          invoiceNo: returnNo,
          type: "return",
          status: "confirmed",
          partyId,
          partyName: partyName ?? "Walk-in Customer",
          invoiceDate: new Date().toISOString().slice(0, 10),
          isIgst: false,
          subtotal: String(totals.subtotal),
          discountAmount: String(totals.discountAmount),
          taxableAmount: String(totals.taxableAmount),
          cgstAmount: String(totals.cgstAmount),
          sgstAmount: String(totals.sgstAmount),
          igstAmount: String(totals.igstAmount),
          totalAmount: String(totals.totalAmount),
          paidAmount: String(refundAmount),
          balanceDue: "0",
          paymentMode: refundMode,
          notes: notes ? `Return against ${invoiceNo}: ${notes}` : `Return against ${invoiceNo}`,
        })
        .returning();

      for (const it of payload.returnItems) {
        if (it.returnQty <= 0) continue;

        const gross = it.rate * it.returnQty;
        const disc = (gross * (it.discountPercent ?? 0)) / 100;
        const tx = gross - disc;
        const tax = (tx * it.gstRate) / 100;
        
        await db.insert(invoiceItems).values({
          invoiceId: retInv.id,
          productId: it.productId,
          variantId: it.variantId ?? null,
          productName: it.name,
          variantName: it.variantName ?? null,
          hsnCode: it.hsnCode ?? null,
          quantity: String(it.returnQty),
          unit: it.unit ?? "PCS",
          rate: String(it.rate),
          discountPercent: String(it.discountPercent ?? 0),
          taxableAmount: String(round2(tx)),
          gstRate: String(it.gstRate),
          taxAmount: String(round2(tax)),
          totalAmount: String(round2(tx + tax)),
        });
        
        if (origType === "sale") {
          if (it.variantId) {
            await db.update(productVariants).set({ currentStock: sql`${productVariants.currentStock} + ${it.returnQty}` }).where(eq(productVariants.id, it.variantId));
          } else {
            await db.update(products).set({ currentStock: sql`${products.currentStock} + ${it.returnQty}` }).where(eq(products.id, it.productId));
          }
        } else if (origType === "purchase") {
          if (it.variantId) {
            await db.update(productVariants).set({ currentStock: sql`${productVariants.currentStock} - ${it.returnQty}` }).where(eq(productVariants.id, it.variantId));
          } else {
            await db.update(products).set({ currentStock: sql`${products.currentStock} - ${it.returnQty}` }).where(eq(products.id, it.productId));
          }
        }
      }

      if (creditAmount > 0 && partyId) {
        if (origType === "sale") {
          await db.insert(khataEntries).values({
            storeId,
            partyId,
            type: "payment",
            amount: String(creditAmount),
            notes: `Sales Return Credit Note — ${returnNo}`,
            entryDate: new Date().toISOString().slice(0, 10),
            invoiceId: retInv.id,
          });

          await db.update(parties).set({ outstandingBalance: sql`${parties.outstandingBalance} - ${creditAmount}` }).where(eq(parties.id, partyId));
        } else if (origType === "purchase") {
          await db.insert(khataEntries).values({
            storeId,
            partyId,
            type: "payment",
            amount: String(creditAmount),
            notes: `Purchase Return Debit Note — ${returnNo}`,
            entryDate: new Date().toISOString().slice(0, 10),
            invoiceId: retInv.id,
          });

          await db.update(parties).set({ outstandingBalance: sql`${parties.outstandingBalance} + ${creditAmount}` }).where(eq(parties.id, partyId));
        }
      }

      window.location.href = `/dashboard/invoices/${retInv.id}`;
    } catch (err) {
      console.error(err);
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
