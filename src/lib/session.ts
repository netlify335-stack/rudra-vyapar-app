import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/neonSchema";
import { eq } from "drizzle-orm";

const COOKIE = "vyapar_store_id";

export async function getActiveStoreId(): Promise<string | null> {
  return "local-store";
}

export async function setActiveStoreId(id: string) {
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function requireStore() {
  // In offline mode, the layout creates the store locally.
  return { id: "local-store", name: "My Local Store" };
}

export async function getOrCreateDemoUser() {
  const existing = await db.select().from(users).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(users)
    .values({ name: "Demo Owner", email: "owner@vyapar.demo" } as any)
    .returning();
  return inserted[0];
}
