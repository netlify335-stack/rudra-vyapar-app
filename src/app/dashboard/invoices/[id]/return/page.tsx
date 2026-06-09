import { getActiveStoreId } from "@/lib/session";
import { ReturnClient } from "./ReturnClient";

export const dynamic = "force-dynamic";

export default async function InvoiceReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeId = (await getActiveStoreId())!;
  
  return <ReturnClient invoiceId={id} storeId={storeId} />;
}
