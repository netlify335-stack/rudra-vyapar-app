import { db } from "@/db";
import { expenses } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";

export async function POST(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ ok: false, error: "No store" }, { status: 400 });
  const b = await req.json() as { category?: string; amount?: number; description?: string; paymentMode?: string };
  if (!b.category || !b.amount) return Response.json({ ok: false, error: "Invalid" }, { status: 400 });
  await db.insert(expenses).values({
    storeId,
    category: b.category,
    amount: String(b.amount),
    description: b.description,
    paymentMode: b.paymentMode || "cash",
    expenseDate: new Date().toISOString().slice(0, 10),
  });
  return Response.json({ ok: true });
}
