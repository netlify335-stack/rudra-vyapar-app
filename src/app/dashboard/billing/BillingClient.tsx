"use client";

import { useEffect, useState } from "react";
import { POSClient } from "./POSClient";
import { getLocalDb } from "@/db/local";
import { products, parties, stores, productVariants, storeExtras } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

export function BillingClient({ storeId }: { storeId: string }) {
  const [data, setData] = useState<{ storeName: string, products: any[], customers: any[] } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const db = await getLocalDb();
        const prodList = await db
          .select()
          .from(products)
          .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
          .orderBy(asc(products.name));
          
        const customerList = await db
          .select({ id: parties.id, name: parties.name, phone: parties.phone, gstin: parties.gstin })
          .from(parties)
          .where(and(eq(parties.storeId, storeId), eq(parties.type, "customer")))
          .orderBy(asc(parties.name));

        const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);

        const productIds = prodList.map(p => p.id);
        const variantsList = productIds.length > 0 
          ? await db.select().from(productVariants).where(inArray(productVariants.productId, productIds))
          : [];

        const extrasList = await db.select().from(storeExtras).where(eq(storeExtras.storeId, storeId));
        const extrasMap = new Map(extrasList.map(e => [e.id, e.name]));

        const productsWithVariants = prodList.map((p) => {
          const vars = variantsList.filter(v => v.productId === p.id).map(v => {
            const parts = [];
            if (v.sizeId && extrasMap.has(v.sizeId)) parts.push(extrasMap.get(v.sizeId));
            if (v.colorId && extrasMap.has(v.colorId)) parts.push(extrasMap.get(v.colorId));
            if (v.materialId && extrasMap.has(v.materialId)) parts.push(extrasMap.get(v.materialId));
            
            return {
              id: v.id,
              price: Number(v.price),
              currentStock: Number(v.currentStock),
              label: parts.length > 0 ? parts.join(" + ") : "Default"
            };
          });

          return {
            id: p.id,
            name: p.name,
            hsnCode: p.hsnCode,
            unit: p.unit,
            sellingPrice: Number(p.sellingPrice),
            gstRate: Number(p.gstRate),
            currentStock: Number(p.currentStock),
            category: p.category,
            barcode: p.barcode,
            rackLocation: p.rackLocation,
            hasVariants: p.hasVariants,
            variants: vars
          };
        });

        setData({ storeName: store?.name || "", products: productsWithVariants, customers: customerList });
      } catch (err) {
        console.error("Error loading POS data from local db:", err);
      }
    }
    load();
  }, [storeId]);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading POS...</div>;

  return <POSClient storeName={data.storeName} storeId={storeId} products={data.products} customers={data.customers} />;
}
