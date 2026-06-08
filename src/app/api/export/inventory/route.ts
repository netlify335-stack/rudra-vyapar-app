import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const storeId = await getActiveStoreId();
  if (!storeId) return new Response("Unauthorized", { status: 401 });

  const data = await db
    .select()
    .from(products)
    .where(eq(products.storeId, storeId))
    .orderBy(desc(products.name));

  const headers = [
    "Product Name",
    "Category",
    "HSN Code",
    "Purchase Price",
    "Selling Price",
    "MRP",
    "GST Rate (%)",
    "Current Stock",
    "Min Stock Level",
    "Unit",
    "Active"
  ];

  const rows = data.map((p) => [
    `"${p.name}"`,
    `"${p.category || ""}"`,
    p.hsnCode || "",
    p.purchasePrice,
    p.sellingPrice,
    p.mrp || "",
    p.gstRate,
    p.currentStock,
    p.minStockLevel,
    p.unit,
    p.isActive ? "Yes" : "No"
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
