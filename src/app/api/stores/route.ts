import { db } from "@/db";
import { stores, users, licenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const currentStoreId = await getActiveStoreId();
  if (!currentStoreId) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });

  const body = await req.json();

  // Find the current store to get the ownerId
  const [currentStore] = await db.select().from(stores).where(eq(stores.id, currentStoreId)).limit(1);
  if (!currentStore) return Response.json({ ok: false, error: "Store not found" }, { status: 404 });

  const ownerId = currentStore.ownerId;

  // Insert new store
  const [newStore] = await db
    .insert(stores)
    .values({
      name: body.name,
      ownerId: ownerId,
      address: body.address || "",
      phone: body.phone || currentStore.phone, // fallback to owner phone
      gstin: body.gstin || "",
    })
    .returning();

  // Create an active license for this new store automatically (unlimited multi-store for now)
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  
  await db.insert(licenses).values({
    storeId: newStore.id,
    key: "MULTI-STORE-" + randomUUID().substring(0, 8).toUpperCase(),
    name: "Multi-Store Branch License",
    validMonths: 12,
    expiresAt: nextYear,
    isPaused: false,
    isRevoked: false,
  });

  return Response.json({ ok: true, storeId: newStore.id });
}
