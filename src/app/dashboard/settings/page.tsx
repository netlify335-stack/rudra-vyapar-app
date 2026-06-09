import { getActiveStoreId } from "@/lib/session";
import { SettingsClient } from "./ClientPage";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const storeId = (await getActiveStoreId())!;

  return <SettingsClient storeId={storeId} />;
}
