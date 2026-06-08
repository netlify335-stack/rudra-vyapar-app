import { db } from "@/db";
import { categories } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function GET() {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const cats = await db.select().from(categories).where(eq(categories.storeId, storeId));
  return Response.json(cats);
}

export async function POST(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  const [newCat] = await db.insert(categories).values({ storeId, name }).returning();
  return Response.json(newCat);
}

export async function DELETE(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  await db.delete(categories).where(eq(categories.id, id));
  return Response.json({ ok: true });
}
