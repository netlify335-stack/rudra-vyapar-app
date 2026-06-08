import { db } from "@/db";
import { inventoryAdjustments, products, productVariants, batches } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { eq, sql, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const storeId = await getActiveStoreId();
    if (!storeId) return Response.json({ ok: false, error: "No active store" }, { status: 400 });
    
    const body = (await req.json()) as {
      productId: string;
      variantId?: string;
      batchId?: string;
      type: "damage" | "loss" | "correction" | "addition";
      quantity: number; // Positive number provided by user
      reason?: string;
    };

    if (!body.productId || !body.quantity) {
      return Response.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    // Determine sign: damage/loss means we deduct from stock. 
    // correction/addition can be positive or negative, but let's assume 'correction' can be negative if quantity is negative?
    // Let's standardise: If type is damage/loss, actualQty is -quantity. 
    // If addition, actualQty is +quantity.
    // If correction, user might provide + or -.
    let actualQty = body.quantity;
    if (body.type === "damage" || body.type === "loss") {
      actualQty = -Math.abs(body.quantity);
    }

    await db.transaction(async (tx) => {
      await tx.insert(inventoryAdjustments).values({
        storeId,
        productId: body.productId,
        variantId: body.variantId ?? null,
        batchId: body.batchId ?? null,
        type: body.type,
        quantity: String(actualQty),
        reason: body.reason,
      });

      if (body.variantId) {
        await tx.update(productVariants)
          .set({ currentStock: sql`${productVariants.currentStock} + ${actualQty}` })
          .where(eq(productVariants.id, body.variantId));
      } else {
        await tx.update(products)
          .set({ currentStock: sql`${products.currentStock} + ${actualQty}` })
          .where(eq(products.id, body.productId));
      }

      if (body.batchId) {
        await tx.update(batches)
          .set({ quantity: sql`${batches.quantity} + ${actualQty}` })
          .where(eq(batches.id, body.batchId));
      }
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
