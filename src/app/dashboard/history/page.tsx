import { getActiveStoreId } from "@/lib/session";
import { HistoryClient } from "./HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: { filter?: string; start?: string; end?: string } }) {
  const storeId = await getActiveStoreId();
  if (!storeId) return null;

  return <HistoryClient storeId={storeId} searchParams={searchParams} />;
}
