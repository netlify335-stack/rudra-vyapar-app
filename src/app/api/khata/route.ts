import { db } from "@/db";
import { khataEntries, parties } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { and, eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ ok: false, error: "No store" }, { status: 400 });
  const body = await req.json() as { partyId: string; type: "credit" | "debit"; amount: number; notes?: string };
  if (!body.partyId || !body.amount || !["credit", "debit"].includes(body.type))
    return Response.json({ ok: false, error: "Invalid input" }, { status: 400 });

  // ensure party belongs to store
  const [p] = await db.select().from(parties).where(and(eq(parties.id, body.partyId), eq(parties.storeId, storeId))).limit(1);
  if (!p) return Response.json({ ok: false, error: "Party not found" }, { status: 404 });

  await db.insert(khataEntries).values({
    storeId,
    partyId: body.partyId,
    type: body.type,
    amount: String(body.amount),
    notes: body.notes,
    entryDate: new Date().toISOString().slice(0, 10),
  });

  const delta = body.type === "credit" ? body.amount : -body.amount;
  await db
    .update(parties)
    .set({ outstandingBalance: sql`${parties.outstandingBalance} + ${delta}` })
    .where(eq(parties.id, body.partyId));

  return Response.json({ ok: true });
}
