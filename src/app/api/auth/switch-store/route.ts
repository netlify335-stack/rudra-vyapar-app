import { getActiveStoreId, setActiveStoreId } from "@/lib/session";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: Request) {
  const currentStoreId = await getActiveStoreId();
  if (!currentStoreId) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const newStoreId = body.storeId;

  if (!newStoreId) return Response.json({ ok: false, error: "Missing storeId" }, { status: 400 });

  // Get current ownerId
  const [currentStore] = await db.select().from(stores).where(eq(stores.id, currentStoreId)).limit(1);
  if (!currentStore) return Response.json({ ok: false, error: "Store not found" }, { status: 404 });

  const ownerId = currentStore.ownerId;

  // Verify the new storeId actually belongs to this owner
  const [targetStore] = await db.select().from(stores).where(eq(stores.id, newStoreId)).limit(1);
  if (!targetStore || targetStore.ownerId !== ownerId) {
    return Response.json({ ok: false, error: "Unauthorized or store not found" }, { status: 403 });
  }

  // Set the new cookie
  await setActiveStoreId(targetStore.id);

  return Response.json({ ok: true });
}
