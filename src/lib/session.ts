import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { stores, users, licenses } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE = "vyapar_store_id";

export async function getActiveStoreId(): Promise<string | null> {
  const jar = await cookies();
  const fromCookie = jar.get(COOKIE)?.value;
  if (fromCookie) return fromCookie;
  // If no cookie, return null to enforce login
  return null;
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

export async function getActiveStore() {
  const id = await getActiveStoreId();
  if (!id) return null;
  const rows = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function requireStore() {
  const store = await getActiveStore();
  if (!store) {
    redirect("/login");
  }

  // Check if license is active
  try {
    const [license] = await db.select().from(licenses).where(eq(licenses.storeId, store.id)).limit(1);
    if (license) {
      if (license.isRevoked || license.isPaused || new Date() > license.expiresAt) {
        // We cannot delete cookies in a Server Component. 
        // Just redirect, the old invalid cookie will be ignored, and overwritten on next login.
        redirect("/login?error=license_inactive");
      }
    }
  } catch (err: any) {
    // Next.js redirect throws a special NEXT_REDIRECT error — re-throw it
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    // Any other DB error — redirect to login
    redirect("/login");
  }

  return store;
}

export async function getOrCreateDemoUser() {
  const existing = await db.select().from(users).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(users)
    .values({ name: "Demo Owner", phone: "+919999999999", email: "owner@vyapar.demo" })
    .returning();
  return inserted[0];
}
