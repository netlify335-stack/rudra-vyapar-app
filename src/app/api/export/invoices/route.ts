import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const storeId = await getActiveStoreId();
  if (!storeId) return new Response("Unauthorized", { status: 401 });

  const data = await db
    .select()
    .from(invoices)
    .where(eq(invoices.storeId, storeId))
    .orderBy(desc(invoices.invoiceDate));

  // CSV Headers
  const headers = [
    "Invoice No",
    "Date",
    "Type",
    "Party Name",
    "Party Phone",
    "Total Amount",
    "Paid Amount",
    "Balance Due",
    "Payment Mode",
    "Status"
  ];

  const rows = data.map((inv) => [
    inv.invoiceNo,
    inv.invoiceDate,
    inv.type.toUpperCase(),
    `"${inv.partyName || "Cash"}"`,
    inv.partyPhone || "",
    inv.totalAmount,
    inv.paidAmount,
    inv.balanceDue,
    inv.paymentMode,
    inv.status
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
