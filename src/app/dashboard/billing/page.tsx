import { db } from "@/db";
import { products, parties, stores, productVariants, storeExtras } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";
import { POSClient } from "./POSClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const storeId = (await getActiveStoreId())!;
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

  // Fetch all variants for the active products
  const productIds = prodList.map(p => p.id);
  const variantsList = productIds.length > 0 
    ? await db.select().from(productVariants).where(inArray(productVariants.productId, productIds))
    : [];

  // Fetch all store extras to resolve names
  const extrasList = await db.select().from(storeExtras).where(eq(storeExtras.storeId, storeId));
  const extrasMap = new Map(extrasList.map(e => [e.id, e.name]));

  // Attach variants to products
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

  return (
    <POSClient
      storeName={store.name}
      products={productsWithVariants}
      customers={customerList}
    />
  );
}
