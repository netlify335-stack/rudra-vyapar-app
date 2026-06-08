import { db } from "@/db";
import { batches, products, productUnits, productExtras, productVariants } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ ok: false, error: "No store" }, { status: 400 });
  const b = await req.json() as {
    name?: string; categoryId?: string; category?: string; hsnCode?: string; unit?: string;
    purchasePrice?: string; sellingPrice?: string; gstRate?: number; 
    minStockLevel?: string; currentStock?: string; rackLocation?: string;
    trackExpiry?: boolean; description?: string; expiryPeriod?: string;
    units?: { unitName: string; conversionRate: number; price?: string }[];
    extras?: string[]; // array of storeExtra IDs
    variants?: { sizeId?: string; colorId?: string; materialId?: string; price: string; currentStock: string }[];
  };
  
  if (!b.name || !b.sellingPrice) return Response.json({ ok: false, error: "name & selling price required" }, { status: 400 });
  
  const hasVariants = b.variants && b.variants.length > 0;
  
  const [row] = await db.insert(products).values({
    storeId,
    name: b.name,
    categoryId: b.categoryId || null,
    category: b.category || null,
    hsnCode: b.hsnCode || null,
    unit: b.unit || "PCS",
    purchasePrice: b.purchasePrice || "0",
    sellingPrice: b.sellingPrice || "0",
    gstRate: String(b.gstRate ?? 18),
    minStockLevel: b.minStockLevel || "0",
    currentStock: hasVariants ? "0" : (b.currentStock || "0"), // Base stock is 0 if variants manage it
    rackLocation: b.rackLocation || null,
    trackExpiry: !!b.trackExpiry || (b.expiryPeriod !== undefined && b.expiryPeriod !== "none"),
    description: b.description || null,
    hasVariants: !!hasVariants,
  }).returning();

  // Insert Units
  if (b.units && b.units.length > 0) {
    await db.insert(productUnits).values(
      b.units.map(u => ({
        productId: row.id,
        unitName: u.unitName,
        conversionRate: String(u.conversionRate),
        price: u.price || null,
      }))
    );
  }

  // Insert Extras Mapping
  if (b.extras && b.extras.length > 0) {
    await db.insert(productExtras).values(
      b.extras.map(extraId => ({
        productId: row.id,
        extraId,
      }))
    );
  }

  // Insert Variants
  if (hasVariants) {
    await db.insert(productVariants).values(
      b.variants!.map(v => ({
        productId: row.id,
        sizeId: v.sizeId || null,
        colorId: v.colorId || null,
        materialId: v.materialId || null,
        price: v.price || b.sellingPrice || "0",
        currentStock: v.currentStock || "0",
      }))
    );
  }

  // Insert Batches (Only if no variants for now to keep simple, or create batches per variant later)
  if (!hasVariants && b.expiryPeriod && b.expiryPeriod !== "none" && Number(b.currentStock || "0") > 0) {
    const months = Number(b.expiryPeriod);
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    
    await db.insert(batches).values({
      storeId,
      productId: row.id,
      batchNo: `AUTO-${Date.now().toString().slice(-6)}`,
      mfgDate: new Date().toISOString().slice(0, 10),
      expiryDate: expiryDate.toISOString().slice(0, 10),
      quantity: b.currentStock || "0",
    });
  }

  return Response.json({ ok: true, id: row.id });
}
