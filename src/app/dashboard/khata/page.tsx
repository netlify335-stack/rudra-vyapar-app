import { getActiveStoreId } from "@/lib/session";
import KhataClient from "./KhataClient";

export const dynamic = "force-dynamic";

export default async function KhataPage() {
  const storeId = (await getActiveStoreId())!;
  return <KhataClient storeId={storeId} />;
}
