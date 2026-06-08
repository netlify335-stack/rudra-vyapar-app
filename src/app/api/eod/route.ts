import { db } from "@/db";
import { eodReports } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const storeId = await getActiveStoreId();
    if (!storeId) return Response.json({ ok: false, error: "No active store" }, { status: 400 });
    
    const body = (await req.json()) as {
      reportDate: string;
      openingBalance: number;
      expectedCash: number;
      actualCash: number;
      expectedUpi: number;
      actualUpi: number;
      discrepancy: number;
      notes?: string;
    };

    await db.insert(eodReports).values({
      storeId,
      reportDate: body.reportDate,
      openingBalance: String(body.openingBalance),
      expectedCash: String(body.expectedCash),
      actualCash: String(body.actualCash),
      expectedUpi: String(body.expectedUpi),
      actualUpi: String(body.actualUpi),
      discrepancy: String(body.discrepancy),
      notes: body.notes,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
