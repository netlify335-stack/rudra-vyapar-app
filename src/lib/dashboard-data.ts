import { db } from "@/db";
import { parties, products, batches } from "@/db/schema";
import { and, eq, gt, lte, sql } from "drizzle-orm";

export async function getAlertCounts(storeId: string) {
  const lowStockRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.isActive, true),
        sql`${products.currentStock} <= ${products.minStockLevel}`,
      ),
    );

  const now = new Date();
  const in10 = new Date();
  in10.setDate(in10.getDate() + 10);

  const expiringRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(batches)
    .where(
      and(
        eq(batches.storeId, storeId),
        gt(batches.quantity, "0"),
        lte(batches.expiryDate, in10.toISOString().slice(0, 10)),
      ),
    );

  const udhaarRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(parties)
    .where(
      and(
        eq(parties.storeId, storeId),
        eq(parties.type, "customer"),
        gt(parties.outstandingBalance, "0"),
      ),
    );

  void now;
  return {
    lowStock: lowStockRows[0]?.count ?? 0,
    expiring: expiringRows[0]?.count ?? 0,
    udhaar: udhaarRows[0]?.count ?? 0,
  };
}
