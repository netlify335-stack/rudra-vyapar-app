import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, licenses } from "@/db/neonSchema";
import { stores } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const allLicenses = await db.select().from(licenses);
    const allUsers = await db.select().from(users);
    const allStores = await db.select().from(stores);

    return NextResponse.json({
      licenses: allLicenses,
      users: allUsers,
      stores: allStores,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
