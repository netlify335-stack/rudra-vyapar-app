import { getActiveStoreId } from "@/lib/session";
import KhataDetailClient from "./KhataDetailClient";

export const dynamic = "force-dynamic";

export default async function KhataDetail({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { id } = await params;
  const sParams = await searchParams;
  const storeId = (await getActiveStoreId())!;

  return <KhataDetailClient storeId={storeId} id={id} searchParams={sParams} />;
}
