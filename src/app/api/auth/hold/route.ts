import { NextResponse } from "next/server";
import { db } from "@/db";
import { licenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStore } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const store = await requireStore();
    const { isPaused } = await req.json();

    await db.update(licenses)
      .set({ isPaused })
      .where(eq(licenses.storeId, store.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
