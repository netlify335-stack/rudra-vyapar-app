import { getActiveStoreId } from "@/lib/session";
import { InvoiceDetailClient } from "./InvoiceDetailClient";

export const dynamic = "force-dynamic";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeId = (await getActiveStoreId())!;
  
  return <InvoiceDetailClient invoiceId={id} storeId={storeId} />;
}
