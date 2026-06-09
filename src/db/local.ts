import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { schemaSql } from "./schema.sql";

// Singleton instance to prevent multiple PGlite databases in memory
let localDb: ReturnType<typeof drizzle> | null = null;
let pgliteInstance: PGlite | null = null;

export async function getLocalDb() {
  if (localDb) return localDb;

  // Initialize PGlite with an IndexedDB storage directory
  pgliteInstance = new PGlite("idb://billing_offline_db");
  await pgliteInstance.waitReady;

  // Execute schema
  try {
    await pgliteInstance.exec(schemaSql);
  } catch(e) {
    console.error("Schema execution failed", e);
  }

  localDb = drizzle(pgliteInstance, { schema });
  return localDb;
}

export function getRawPGlite() {
  return pgliteInstance;
}
