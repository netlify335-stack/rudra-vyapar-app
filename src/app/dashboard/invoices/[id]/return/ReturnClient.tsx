"use client";

import { useEffect, useState } from "react";
import { getLocalDb } from "@/db/local";
import { invoices, invoiceItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ReturnForm } from "./ReturnForm";

export function ReturnClient({ invoiceId, storeId }: { invoiceId: string, storeId: string }) {
  const [data, setData] = useState<{ inv: any, items: any[] } | null>(null);
  const [error, setError] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const db = await getLocalDb();
        const [inv] = await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, invoiceId), eq(invoices.storeId, storeId)))
          .limit(1);

        if (!inv) {
          setError(true);
          return;
        }
        
        if (inv.type === "estimate" || inv.type === "return") {
          setRedirecting(true);
          window.location.href = `/dashboard/invoices/${invoiceId}`;
          return;
        }

        const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

        setData({ inv, items });
      } catch (err) {
        console.error("Failed to load return details", err);
        setError(true);
      }
    }
    load();
  }, [invoiceId, storeId]);

  if (redirecting) return <div className="p-8 text-center text-slate-500">Redirecting...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">Invoice not found or error loading it.</div>;
  if (!data) return <div className="p-8 text-center text-slate-500">Loading Return Details...</div>;

  const { inv, items } = data;

  return (
    <ReturnForm 
      invoiceId={inv.id}
      invoiceNo={inv.invoiceNo}
      partyName={inv.partyName}
      partyId={inv.partyId}
      isSale={inv.type === "sale"}
      origType={inv.type}
      storeId={storeId}
      items={items.map(it => ({
        id: it.id,
        productId: it.productId!,
        variantId: it.variantId,
        productName: it.productName,
        variantName: it.variantName,
        hsnCode: it.hsnCode,
        unit: it.unit,
        rate: String(it.rate),
        quantity: String(it.quantity),
        discountPercent: String(it.discountPercent),
        gstRate: String(it.gstRate),
      }))}
    />
  );
}
