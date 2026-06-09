import { requireStore } from "@/lib/session";
import { PrintClient } from "./PrintClient";

export const dynamic = "force-dynamic";

export default async function PrintReportPage({ searchParams }: { searchParams: { type: string } }) {
  const store = await requireStore();

  return <PrintClient store={store} searchParams={searchParams} />;
}
