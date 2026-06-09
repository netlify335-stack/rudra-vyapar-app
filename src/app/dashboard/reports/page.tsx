import { getActiveStoreId } from "@/lib/session";
import { ReportsClient } from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const storeId = (await getActiveStoreId())!;
  const params = await searchParams;

  return <ReportsClient storeId={storeId} searchParams={params} />;
}
