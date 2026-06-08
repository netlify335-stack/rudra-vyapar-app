import { db } from "@/db";
import { invoices, invoiceItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getActiveStoreId } from "@/lib/session";
import { ReturnForm } from "./ReturnForm";

export const dynamic = "force-dynamic";

export default async function InvoiceReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeId = (await getActiveStoreId())!;
  
  const [inv] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.storeId, storeId)))
    .limit(1);

  if (!inv) notFound();
  
  // Can't return an estimate or an already returned invoice
  if (inv.type === "estimate" || inv.type === "return") {
    redirect(`/dashboard/invoices/${id}`);
  }

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

  return (
    <ReturnForm 
      invoiceId={inv.id}
      invoiceNo={inv.invoiceNo}
      partyName={inv.partyName}
      isSale={inv.type === "sale"}
      items={items.map(it => ({
        id: it.id,
        productId: it.productId!,
        variantId: it.variantId,
        productName: it.productName,
        variantName: it.variantName,
        hsnCode: it.hsnCode,
        unit: it.unit,
        rate: it.rate,
        quantity: it.quantity,
        discountPercent: it.discountPercent,
        gstRate: it.gstRate,
      }))}
    />
  );
}
