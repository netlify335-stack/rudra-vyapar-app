import { db } from "@/db";
import { parties } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";

export async function POST(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ ok: false, error: "No store" }, { status: 400 });
  const body = await req.json() as { type?: string; name?: string; phone?: string; gstin?: string; city?: string };
  if (!body.name) return Response.json({ ok: false, error: "Name required" }, { status: 400 });
  const t = body.type === "supplier" ? "supplier" : "customer";
  const [row] = await db.insert(parties).values({
    storeId,
    type: t,
    name: body.name,
    phone: body.phone || null,
    gstin: body.gstin || null,
    city: body.city || null,
  }).returning();
  return Response.json({ ok: true, id: row.id });
}
