import { getActiveStoreId } from "@/lib/session";
import PartiesClient from "./PartiesClient";

export const dynamic = "force-dynamic";

export default async function PartiesPage() {
  const storeId = (await getActiveStoreId())!;
  return <PartiesClient storeId={storeId} />;
}
