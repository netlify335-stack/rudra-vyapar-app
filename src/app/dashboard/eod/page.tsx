import { getActiveStoreId } from "@/lib/session";
import { EodClient } from "./ClientPage";

export const dynamic = "force-dynamic";

export default async function EodPage() {
  const storeId = (await getActiveStoreId())!;

  return <EodClient storeId={storeId} />;
}
