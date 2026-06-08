import { db } from "@/db";
import { storeExtras } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // color, size, material

  let query = db.select().from(storeExtras).where(eq(storeExtras.storeId, storeId));
  const results = await query;
  
  if (type) {
    return Response.json(results.filter(r => r.type === type));
  }

  return Response.json(results);
}

export async function POST(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type } = await req.json();
  if (!name || !type) return Response.json({ error: "Name and type required" }, { status: 400 });

  const [newExtra] = await db.insert(storeExtras).values({ storeId, name, type }).returning();
  return Response.json(newExtra);
}

export async function DELETE(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  await db.delete(storeExtras).where(eq(storeExtras.id, id));
  return Response.json({ ok: true });
}
