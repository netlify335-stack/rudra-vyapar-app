"use client";

import { HqClient } from "./ClientPage";

export default function HQDashboardPage() {
  // Offline fallback, just load HQ with local owner
  return <HqClient ownerId="local-owner" />;
}
