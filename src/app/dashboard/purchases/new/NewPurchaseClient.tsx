"use client";

import { useEffect, useState } from "react";
import { POSClient } from "../../billing/POSClient";
import { getLocalDb } from "@/db/local";
import { products, parties, stores } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export function NewPurchaseClient({ storeId }: { storeId: string }) {
  const [data, setData] = useState<{ storeName: string, products: any[], customers: any[] } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const db = await getLocalDb();
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
        
        const prodList = await db
          .select()
          .from(products)
          .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
          .orderBy(asc(products.name));
          
        const supplierList = await db
          .select({ id: parties.id, name: parties.name, phone: parties.phone, gstin: parties.gstin })
          .from(parties)
          .where(and(eq(parties.storeId, storeId), eq(parties.type, "supplier")))
          .orderBy(asc(parties.name));

        const mappedProducts = prodList.map((p) => ({
          id: p.id,
          name: p.name,
          hsnCode: p.hsnCode,
          unit: p.unit,
          sellingPrice: Number(p.purchasePrice), // For purchases, default rate is purchasePrice
          gstRate: Number(p.gstRate),
          currentStock: Number(p.currentStock),
          category: p.category,
          barcode: p.barcode,
        }));

        setData({ storeName: store?.name || "", products: mappedProducts, customers: supplierList });
      } catch (err) {
        console.error("Error loading purchase data from local db:", err);
      }
    }
    load();
  }, [storeId]);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading POS...</div>;

  return (
    <POSClient
      storeName={data.storeName}
      storeId={storeId}
      isPurchase={true}
      products={data.products}
      customers={data.customers}
    />
  );
}
