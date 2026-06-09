import { getActiveStoreId } from "@/lib/session";
import { PurchasesClient } from "./PurchasesClient";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const storeId = (await getActiveStoreId())!;
  
  return <PurchasesClient storeId={storeId} />;
}
