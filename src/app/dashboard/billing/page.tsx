"use client";
import { BillingClient } from "./BillingClient";

export default function BillingPage() {
  const storeId = "local-store";
  return <BillingClient storeId={storeId} />;
}
