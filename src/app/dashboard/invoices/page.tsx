import { getActiveStoreId } from "@/lib/session";
import { InvoicesClient } from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const storeId = (await getActiveStoreId())!;
  
  return <InvoicesClient storeId={storeId} />;
}
