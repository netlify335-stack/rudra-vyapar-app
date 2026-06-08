import { db } from "@/db";
import { parties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const storeId = await getActiveStoreId();
  if (!storeId) return new Response("Unauthorized", { status: 401 });

  const data = await db
    .select()
    .from(parties)
    .where(eq(parties.storeId, storeId))
    .orderBy(desc(parties.type)); // group by supplier/customer

  const headers = [
    "Party Type",
    "Party Name",
    "Phone",
    "GSTIN",
    "Address",
    "Outstanding Balance (Udhaari)",
  ];

  const rows = data.map((p) => [
    p.type.toUpperCase(),
    `"${p.name}"`,
    p.phone || "",
    p.gstin || "",
    `"${p.address || ""}"`,
    p.outstandingBalance
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="khata_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
