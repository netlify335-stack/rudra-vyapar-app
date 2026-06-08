import { db } from "@/db";
import { batches, products } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";

export async function POST(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ ok: false, error: "No store" }, { status: 400 });
  const b = await req.json() as {
    name?: string; category?: string; hsnCode?: string; unit?: string;
    purchasePrice?: string; sellingPrice?: string; mrp?: string;
    gstRate?: number; minStockLevel?: string; currentStock?: string;
    trackExpiry?: boolean; description?: string; expiryPeriod?: string;
  };
  if (!b.name || !b.sellingPrice) return Response.json({ ok: false, error: "name & selling price required" }, { status: 400 });
  
  const [row] = await db.insert(products).values({
    storeId,
    name: b.name,
    category: b.category || null,
    hsnCode: b.hsnCode || null,
    unit: b.unit || "PCS",
    purchasePrice: b.purchasePrice || "0",
    sellingPrice: b.sellingPrice || "0",
    mrp: b.mrp || b.sellingPrice || "0",
    gstRate: String(b.gstRate ?? 18),
    minStockLevel: b.minStockLevel || "0",
    currentStock: b.currentStock || "0",
    trackExpiry: !!b.trackExpiry || (b.expiryPeriod !== undefined && b.expiryPeriod !== "none"),
    description: b.description || null,
  }).returning();

  if (b.expiryPeriod && b.expiryPeriod !== "none" && Number(b.currentStock || "0") > 0) {
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
      mrp: b.mrp || b.sellingPrice || "0",
    });
  }

  return Response.json({ ok: true, id: row.id });
}
