"use client";

import { use } from "react";
import { ExpensesClient } from "./ExpensesClient";

export default function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const storeId = "local-store";
  const params = use(searchParams);
  
  return <ExpensesClient storeId={storeId} searchParams={params} />;
}
