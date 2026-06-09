import { getActiveStoreId } from "@/lib/session";
import { NewPurchaseClient } from "./NewPurchaseClient";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const storeId = (await getActiveStoreId())!;
  
  return <NewPurchaseClient storeId={storeId} />;
}
