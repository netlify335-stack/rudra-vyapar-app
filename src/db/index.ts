import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

const globalForDb = globalThis as typeof globalThis & {
  __postgres?: ReturnType<typeof postgres>;
};

// Use explicit SSL config for AWS Lambda environments
export const client =
  globalForDb.__postgres ??
  postgres(connectionString, {
    ssl: "require",
    max: 1, // Minimize pool size for serverless
  });

if (process.env.NODE_ENV !== "production") globalForDb.__postgres = client;

export const db = drizzle(client);
